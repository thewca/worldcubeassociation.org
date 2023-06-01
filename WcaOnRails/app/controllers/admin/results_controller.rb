# frozen_string_literal: true

module Admin
  class ResultsController < AdminController
    # NOTE: authentication is performed by admin controller

    def new
      competition = Competition.find(params[:competition_id])
      round = Round.find(params[:round_id])
      # Create some basic attributes for that empty result.
      # Using Result.new wouldn't work here: we have no idea what the country
      # could be and so on, so serialization would fail.
      @result = {
        competition_id: competition.id,
        round_type_id: round.round_type_id,
        format_id: round.format.id,
        event_id: round.event.id,
      }
    end

    def show
      respond_to do |format|
        format.json { render json: Result.find(params.require(:id)) }
      end
    end

    def show_events_data
      competition = Competition.find(params[:competition_id])
      events_data = competition.competition_events.to_h do |ce|
        [ce.event_id, {
          eventId: ce.event_id,
          rounds: ce.rounds.map do |r|
            {
              roundTypeId: r.round_type_id,
              formatId: r.format_id,
            }
          end,
        }]
      end

      respond_to do |format|
        format.json { render json: events_data }
      end
    end

    def edit
      @result = Result.includes(:competition).find(params[:id])
    end

    def create
      json = {}
      # Build a brand new result, validations will make sure the specified round
      # data are valid.
      result = Result.new(result_params)
      if result.save
        # We just inserted a new result, make sure we at least give it the
        # correct position.
        validator = ResultsValidators::PositionsValidator.new(apply_fixes: true)
        validator.validate(competition_ids: [result.competition_id])
        json[:messages] = ["Result inserted!"].concat(validator.infos.map(&:to_s))
      else
        json[:errors] = result.errors.map(&:full_message)
      end
      render json: json
    end

    def update
      result = Result.find(params.require(:id))
      # Since we may move the result to another competition, we want to validate
      # both competitions if needed.
      competitions_to_validate = [result.competition_id]
      if result.update(result_params)
        competitions_to_validate << result.competition_id
        competitions_to_validate.uniq!
        validator = ResultsValidators::PositionsValidator.new(apply_fixes: true)
        validator.validate(competition_ids: competitions_to_validate)
        info = if result.saved_changes.empty?
                 ["It looks like you submitted the exact same result, so no changes were made."]
               else
                 ["The result was saved."]
               end
        if competitions_to_validate.size > 1
          info << "The results was moved to another competition, make sure to check the competition validators for both of them."
        end
        render json: {
          # Make sure we emit the competition's id next to the info, because we
          # may validate multiple competitions at the same time.
          messages: info.concat(validator.infos.map { |i| "[#{i.competition_id}]#{i}" }),
        }
      else
        render json: {
          errors: result.errors.map(&:full_message),
        }
      end
    end

    def destroy
      result = Result.find(params.require(:id))
      competition_id = result.competition_id
      result.destroy!

      # Create a results validator to fix positions if needed
      validator = ResultsValidators::PositionsValidator.new(apply_fixes: true)
      validator.validate(competition_ids: [competition_id])

      render json: {
        messages: ["Result deleted!"].concat(validator.infos.map(&:to_s)),
      }
    end

    private def result_params
      params.require(:result).permit(:value1, :value2, :value3, :value4, :value5,
                                     :competition_id, :round_type_id, :event_id, :format_id,
                                     :person_name, :person_id, :country_id,
                                     :best, :average,
                                     :regional_single_record, :regional_average_record)
    end
  end
end
