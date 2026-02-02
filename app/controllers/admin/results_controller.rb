# frozen_string_literal: true

module Admin
  class ResultsController < AdminController
    # NOTE: authentication is performed by admin controller

    def posting_index
      @pending_competitions = Competition.pending_posting.order(results_submitted_at: :asc)
      user_attributes = {
        only: %w[id name],
        methods: [],
        include: [],
      }
      render json: {
        current_user: current_user.as_json(user_attributes),
        competitions: @pending_competitions.as_json(
          only: %w[name results_submitted_at],
          methods: %w[id city country_iso2],
          include: {
            posting_user: user_attributes,
            result_ticket: {},
          },
        ),
      }
    end

    def start_posting
      # The purpose of this action is to allow an admin to "lock" and start
      # posting competitions. This is an informative lock that relies on
      # WRT members common sense though, nothing should actually prevent
      # posting from happening.
      # If posting is possible, the idea is to:
      #   - get all pending competitions
      #   - filter out those who are already being posted (by the same member)
      #   - intersect with the competitions in the parameters
      #   - either lock them and reply ok, or there is none to lock and reply
      #   it was a no-op.
      @updated_competitions = Competition.pending_posting.where(posting_user: nil).where(competition_id: params[:competition_ids])
      return render json: { error: "No competitions to lock." } if @updated_competitions.empty?

      ActiveRecord::Base.transaction do
        TicketsCompetitionResult.where(competition: @updated_competitions)
                                .update_all(status: TicketsCompetitionResult.statuses[:locked_for_posting])
        @updated_competitions.update(posting_user: current_user)
      end

      render json: { message: "Competitions successfully locked, go on posting!" }
    end

    def show
      respond_to do |format|
        format.json { render json: Result.find(params.require(:id)) }
      end
    end

    def new
      competition = Competition.find(params[:competition_id])
      round = Round.find(params[:round_id])
      # Create some basic attributes for that empty result.
      # Using Result.new wouldn't work here: we have no idea what the country
      # could be and so on, so serialization would fail.
      @result = {
        competition_id: competition.id,
        round_type_id: round.round_type_id,
        round_id: round.id,
        format_id: round.format.id,
        event_id: round.event.id,
      }
    end

    def show_events_data
      competition = Competition.find(params[:competition_id])
      events_data = competition.competition_events.to_h do |ce|
        [ce.event_id, {
          eventId: ce.event_id,
          rounds: ce.rounds.map do |r|
            {
              roundId: r.id,
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
        info << "The results was moved to another competition, make sure to check the competition validators for both of them." if competitions_to_validate.size > 1
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
      params.expect(result: %i[value1 value2 value3 value4 value5
                               competition_id round_type_id round_id event_id
                               format_id person_name person_id country_id
                               best average
                               regional_single_record regional_average_record])
    end
  end
end
