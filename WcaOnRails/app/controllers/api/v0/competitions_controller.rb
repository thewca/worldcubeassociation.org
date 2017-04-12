# frozen_string_literal: true
class Api::V0::CompetitionsController < Api::V0::ApiController
  def index
    managed_by_user = nil
    if params[:managed_by_me].present?
      require_scope!("manage_competitions")
      managed_by_user = current_api_user
    end

    competitions = Competition.search(params[:q], params: params, managed_by_user: managed_by_user)
    competitions = competitions.includes(:delegates, :organizers)

    paginate json: competitions
  end

  def show
    competition = competition_from_params
    render json: competition
  end

  def show_wcif
    competition = competition_from_params
    require_can_manage!(competition)

    render json: competition.wcif.json
  end

  private def competition_from_params
    id = params[:competition_id] || params[:id]
    competition = Competition.find_by_id(id)

    # If this competition exists, but is not publicly visible, then only show it
    # to the user if they are able to manage the competition.
    if competition && !competition.showAtAll && !can_manage?(competition)
      competition = nil
    end

    raise WcaExceptions::NotFound.new("Competition with id #{id} not found") unless competition
    competition
  end

  private def can_manage?(competition)
    current_api_user&.can_manage_competition?(competition) && doorkeeper_token.scopes.exists?("manage_competitions")
  end

  private def require_scope!(scope)
    raise WcaExceptions::MustLogIn.new unless current_api_user
    raise WcaExceptions::BadApiParameter.new("Missing required scope '#{scope}'") unless doorkeeper_token.scopes.include?(scope)
  end

  def require_can_manage!(competition)
    raise WcaExceptions::MustLogIn.new unless current_api_user
    raise WcaExceptions::NotPermitted.new("Not authorized to manage competition") unless can_manage?(competition)
  end
end
