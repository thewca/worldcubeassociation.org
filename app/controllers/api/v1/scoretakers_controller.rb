# frozen_string_literal: true

class Api::V1::ScoretakersController < Api::V1::ApiController
  SCORETAKER_JSON = { only: %i[user_id], methods: %i[name] }.freeze

  protect_from_forgery with: :null_session

  before_action :set_competition

  def index
    render json: @competition.competition_scoretakers.includes(:user).as_json(SCORETAKER_JSON)
  end

  def create
    require_manage!(@competition)
    user_id = params.require(:user_id)
    scoretaker = @competition.competition_scoretakers.find_or_create_by!(user_id: user_id)
    render json: scoretaker.as_json(SCORETAKER_JSON)
  end

  def destroy
    require_manage!(@competition)
    scoretaker = @competition.competition_scoretakers.find_by(user_id: params.require(:id))
    scoretaker&.destroy!
    render json: scoretaker.as_json(SCORETAKER_JSON)
  end

  private

    def set_competition
      @competition = Competition.find(params.require(:competition_id))
    end
end
