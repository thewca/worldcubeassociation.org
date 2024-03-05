# frozen_string_literal: true

class CompetitionsV2Controller < ApplicationController
  def show
    competition_id = params.require(:id)
    @competition = Competition.find(competition_id)
    raise ActionController::RoutingError.new('Not Found') unless @competition.present? && @competition.user_can_view?(current_user)
    redirect_to competition_path(@competition) unless @competition.uses_new_registration_service?
  end
end
