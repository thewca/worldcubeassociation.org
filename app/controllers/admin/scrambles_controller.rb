# frozen_string_literal: true

module Admin
  class ScramblesController < AdminController
    # NOTE: authentication is performed by admin controller

    def new
      competition = Competition.find(params[:competition_id])
      round = Round.find(params[:round_id])
      # Create some basic attributes for that empty scramble.
      @scramble = {
        competitionId: competition.id,
        roundTypeId: round.round_type_id,
        eventId: round.event.id,
      }
    end

    def show
      respond_to do |format|
        format.json { render json: Scramble.find(params.require(:id)) }
      end
    end

    def edit
      @scramble = Scramble.includes(:competition).find(params[:id])
    end

    def create
      json = {}
      # Build a brand new scramble, validations will make sure the specified round
      # data are valid.
      scramble = Scramble.new(scramble_params)
      if scramble.save
        # We just inserted a new scramble, make sure we at least give it correct information.
        validator = ResultsValidators::ScramblesValidator.new(apply_fixes: true)
        validator.validate(competition_ids: [scramble.competitionId])
        json[:messages] = ["Scramble inserted!"].concat(validator.infos.map(&:to_s))
      else
        json[:errors] = scramble.errors.map(&:full_message)
      end
      render json: json
    end

    def update
      scramble = Scramble.find(params.require(:id))
      # Since we may move the scramble to another competition, we want to validate
      # both competitions if needed.
      competitions_to_validate = [scramble.competitionId]
      if scramble.update(scramble_params)
        competitions_to_validate << scramble.competitionId
        competitions_to_validate.uniq!
        validator = ResultsValidators::ScramblesValidator.new(apply_fixes: true)
        validator.validate(competition_ids: competitions_to_validate)
        info = if scramble.saved_changes.empty?
                 ["It looks like you submitted the exact same scramble, so no changes were made."]
               else
                 ["The scramble was saved."]
               end
        if competitions_to_validate.size > 1
          info << "The scrambles was moved to another competition, make sure to check the competition validators for both of them."
        end
        render json: {
          # Make sure we emit the competition's id next to the info, because we
          # may validate multiple competitions at the same time.
          messages: info.concat(validator.infos.map { |i| "[#{i.competition_id}]#{i}" }),
        }
      else
        render json: {
          errors: scramble.errors.map(&:full_message),
        }
      end
    end

    def destroy
      scramble = Scramble.find(params.require(:id))
      competition_id = scramble.competitionId
      scramble.destroy!

      # Create a results validator to fix information if needed
      validator = ResultsValidators::ScramblesValidator.new(apply_fixes: true)
      validator.validate(competition_ids: [competition_id])

      render json: {
        messages: ["Scramble deleted!"].concat(validator.infos.map(&:to_s)),
      }
    end

    private def scramble_params
      params.require(:scramble).permit(:competitionId, :roundTypeId, :eventId, :groupId,
                                       :isExtra, :scrambleNum, :scramble)
    end
  end
end
