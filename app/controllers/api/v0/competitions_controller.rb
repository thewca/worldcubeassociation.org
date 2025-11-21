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
    competitions = competitions.includes(:delegates, :organizers, :events)

    paginate json: competitions
  end

  def mine
    grouped_competitions, registration_statuses = require_user!.my_competitions

    serial_competitions = grouped_competitions
                          .transform_keys { :"#{it}_competitions" }
                          .transform_values { it.as_json(User::MY_COMPETITIONS_SERIALIZATION_HASH) }

    render json: {
      **serial_competitions,
      registrations_by_competition: registration_statuses,
    }
  end

  def competition_index
    admin_mode = current_user&.can_see_admin_competitions?

    competitions_scope = Competition.includes(:events, :championships)
    competitions_scope = competitions_scope.includes(:delegate_report, delegates: [:current_avatar]) if admin_mode

    competitions = competitions_scope.search(params[:q], params: params)

    serial_methods = %w[short_display_name city country_iso2 event_ids latitude_degrees longitude_degrees announced_at championship_types]
    serial_includes = {}

    serial_includes["delegates"] = { only: %w[id name], methods: [], include: ["avatar"] } if admin_mode
    serial_methods |= %w[results_submitted_at results_posted_at report_posted_at report_posted_by_user] if admin_mode

    paginate json: competitions,
             only: %w[id name start_date end_date registration_open registration_close venue competitor_limit main_event_id],
             methods: serial_methods,
             include: serial_includes
  end

  def show
    competition = competition_from_params

    render json: competition.to_competition_info if stale?(competition)
  end

  def qualifications
    competition = competition_from_params(associations: [:competition_events])

    render json: competition.qualification_wcif
  end

  def events
    competition = competition_from_params
    render json: competition.events_wcif
  end

  def schedule
    competition = competition_from_params
    render json: competition.schedule_wcif
  end

  def results
    competition = competition_from_params
    render json: competition.results
  end

  def podiums
    competition = Competition.find(params.require(:competition_id))

    render json: competition.results.podium
  end

  def event_results
    competition = competition_from_params(associations: [:rounds])
    event = Event.c_find!(params[:event_id])
    rounds = competition.results
                        .includes(:round)
                        .where(event_id: event.id)
                        .group_by(&:round)
                        .sort_by { |round, _| -round.number }
                        .map do |round, results|
      {
        id: round.id,
        roundTypeId: round.round_type_id,
        results: results.sort_by { |r| [r.pos, r.person_name] },
      }
    end
    render json: {
      id: event.id,
      rounds: rounds,
    }
  end

  def scrambles
    competition = competition_from_params
    render json: competition.scrambles
  end

  def event_scrambles
    competition = competition_from_params
    event = Event.c_find!(params[:event_id])
    rounds = competition.scrambles
                        .includes(:round)
                        .where(event_id: event.id)
                        .group_by(&:round)
                        .sort_by { |round, _| -round.number }
                        .map do |round, scrambles|
      {
        id: round.id,
        roundTypeId: round.round_type_id,
        scrambles: scrambles,
      }
    end
    render json: {
      id: event.id,
      rounds: rounds,
    }
  end

  def event_psych_sheet
    competition = competition_from_params
    event = Event.c_find!(params[:event_id])

    # optional
    sort_by = params[:sort_by]

    render json: competition.psych_sheet_event(event, sort_by)
  end

  def competitors
    competition = competition_from_params
    render json: competition.competitors
  end

  def registrations
    competition = competition_from_params
    render json: competition.registrations.accepted.includes(:events)
  end

  def registration_data
    competition_ids = params.require(:ids)

    data = CacheAccess.hydrate_entities('comp-registration-data', competition_ids, expires_in: 5.minutes) do |uncached_ids|
      Competition.find(uncached_ids).map { |comp| { id: comp.id, registration_status: comp.registration_status } }
    end

    render json: data
  end

  def show_wcif
    competition = competition_from_params
    require_can_manage!(competition)

    render json: competition.to_wcif(authorized: true)
  end

  def show_wcif_public
    id = params[:competition_id] || params[:id]
    cache_key = "wcif/#{id}"
    competition = competition_from_params
    expires_in 5.minutes, public: true
    return unless stale?(competition, public: true)

    render json: Rails.cache.fetch(cache_key, expires_in: 5.minutes) {
      competition.to_wcif
    }
  end

  def update_wcif
    competition = competition_from_params
    require_can_manage!(competition)
    wcif = params.permit!.to_h
    wcif = wcif["_json"] || wcif
    competition.set_wcif!(wcif, require_user!)
    render json: {
      status: "Successfully saved WCIF",
    }
  rescue ActiveRecord::RecordInvalid => e
    render status: :bad_request, json: {
      status: "Error while saving WCIF",
      error: e,
    }
  rescue JSON::Schema::ValidationError => e
    render status: :bad_request, json: {
      status: "Error while saving WCIF",
      error: e.message,
    }
  end

  private def competition_from_params(associations: {})
    id = params[:competition_id] || params[:id]
    competition = Competition.includes(associations).find_by(id: id)

    # If this competition exists, but is not publicly visible, then only show it
    # to the user if they are able to manage the competition.
    competition = nil if competition && !competition.show_at_all && !can_manage?(competition)

    raise WcaExceptions::NotFound.new("Competition with id #{id} not found") unless competition

    competition
  end

  private def can_manage?(competition)
    api_user_can_manage = current_api_user&.can_manage_competition?(competition) && doorkeeper_token.scopes.exists?("manage_competitions")
    api_user_can_manage || current_user&.can_manage_competition?(competition)
  end

  private def require_scope!(scope)
    require_user!
    raise WcaExceptions::BadApiParameter.new("Missing required scope '#{scope}'") if current_api_user && doorkeeper_token.scopes.exclude?(scope) # If we deal with an OAuth user then check the scopes.
  end

  def require_can_manage!(competition)
    require_user!
    raise WcaExceptions::NotPermitted.new("Not authorized to manage competition") unless can_manage?(competition)
  end
end
