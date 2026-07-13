# frozen_string_literal: true

class Api::V1::ScoretakersController < Api::V1::ApiController
  protect_from_forgery with: :null_session

  before_action :set_competition

  def index
    render json: scoretakers_json
  end

  def create
    require_manage!(@competition)
    user_id = params.require(:user_id)
    @competition.competition_scoretakers.find_or_create_by!(user_id: user_id)
    render json: scoretakers_json
  end

  def destroy
    require_manage!(@competition)
    @competition.competition_scoretakers.where(user_id: params.require(:id)).destroy_all
    render json: scoretakers_json
  end

  private

    def set_competition
      @competition = Competition.find(params.require(:competition_id))
    end

    def scoretakers_json
      @competition.scoretakers.map { |user| { user_id: user.id, name: user.name } }
    end
end
