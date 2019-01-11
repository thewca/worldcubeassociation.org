# frozen_string_literal: true

class Api::V0::CompetitionsController < Api::V0::ApiController
  # Enable CSRF protection if we use cookies based user instead of OAuth one.
  protect_from_forgery if: -> { current_user.present? }, with: :exception

  def index
    managed_by_user = nil
    if params[:managed_by_me].present?
      require_scope!("manage_competitions")
      managed_by_user = current_api_user || current_user
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
    # This is all the associations we may need for the competition WCIF!
    # Since registrations are ordered later, associations inclusion for them is done later
    includes_associations = [
      :delegates,
      :organizers,
      { competition_events: [rounds: :competition_event] },
      { competition_venues: { venue_rooms: [schedule_activities: :child_activities] } },
    ]
    competition = competition_from_params(includes_associations)
    require_can_manage!(competition)

    render json: competition.to_wcif
  end

  def update_wcif
    includes_associations = [{
      competition_venues: {
        venue_rooms: {
          schedule_activities: [{ child_activities: [:holder] }, :holder],
        },
      },
    }]
    competition = competition_from_params(includes_associations)
    require_can_manage!(competition)
    wcif = params.permit!.to_h
    wcif = wcif["_json"] || wcif
    competition.set_wcif!(wcif, require_user!)
    render json: {
      status: "Successfully saved WCIF",
    }
  rescue ActiveRecord::RecordInvalid => e
    render status: 400, json: {
      status: "Error while saving WCIF",
      error: e,
    }
  rescue JSON::Schema::ValidationError => e
    render status: 400, json: {
      status: "Error while saving WCIF",
      error: e.message,
    }
  end

  private def competition_from_params(associations = {})
    id = params[:competition_id] || params[:id]
    base_model = associations.any? ? Competition.includes(associations) : Competition
    competition = base_model.find_by_id(id)

    # If this competition exists, but is not publicly visible, then only show it
    # to the user if they are able to manage the competition.
    if competition && !competition.showAtAll && !can_manage?(competition)
      competition = nil
    end

    raise WcaExceptions::NotFound.new("Competition with id #{id} not found") unless competition
    competition
  end

  private def can_manage?(competition)
    api_user_can_manage = current_api_user&.can_manage_competition?(competition) && doorkeeper_token.scopes.exists?("manage_competitions")
    api_user_can_manage || current_user&.can_manage_competition?(competition)
  end

  private def require_user!
    raise WcaExceptions::MustLogIn.new if current_api_user.nil? && current_user.nil?
    current_api_user || current_user
  end

  private def require_scope!(scope)
    require_user!
    if current_api_user # If we deal with an OAuth user then check the scopes.
      raise WcaExceptions::BadApiParameter.new("Missing required scope '#{scope}'") unless doorkeeper_token.scopes.include?(scope)
    end
  end

  def require_can_manage!(competition)
    require_user!
    raise WcaExceptions::NotPermitted.new("Not authorized to manage competition") unless can_manage?(competition)
  end
end
