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
    serial_methods |= %w[results_submitted_at results_posted_at report_posted_at report_posted_by_user lead_delegate_id] if admin_mode

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

  def tabs
    competition = competition_from_params
    render json: competition.tabs
  end

  def podiums
    competition = Competition.find(params.require(:competition_id))

    render json: competition.results.podium
  end

  def event_results
    competition = competition_from_params(associations: [:rounds])
    event = Event.c_find!(params[:event_id])
    rounds = competition.rounds
                        .includes(:results)
                        .where(competition_events: { event: event })
                        .except(:order)
                        .order(number: :desc)
                        .map do |round|
                          {
                            id: round.id,
                            roundTypeId: round.round_type_id,
                            isH2hMock: round.is_h2h_mock?,
                            results: round.results.sort_by { |r| [r.pos, r.person_name] },
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
    rounds = competition.rounds
                        .includes(:scrambles)
                        .where(competition_events: { event: event })
                        .except(:order)
                        .order(number: :desc)
                        .map do |round|
                          {
                            id: round.id,
                            roundTypeId: round.round_type_id,
                            scrambles: round.scrambles,
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

  WCIF_CACHE_MAX_AGE = 5.minutes

  private def render_wcif(competition, version, force_public: false)
    if can_manage?(competition) && !force_public
      # authorized access always gets a "fresh" WCIF,
      #   because it might be relevant for syncing
      return render json: competition.to_wcif(authorized: true, version: version)
    end

    # In the context of WCIF, "unauthorized" means "public",
    #   that is you can still see the WCIF but only without sensitive information like DOB.
    # As this is the far more common use-case, we cache the public version for up to 5 minutes
    #   to reduce traffic and counteract scraping.
    return unless stale?(
      etag: [competition, version],
      last_modified: competition.updated_at,
      public: true,
      cache_control: { max_age: WCIF_CACHE_MAX_AGE },
    )

    cache_key = "wcif/#{competition.id}/#{version}"
    render json: Rails.cache.fetch(cache_key, expires_in: WCIF_CACHE_MAX_AGE) { competition.to_wcif(authorized: false, version: version) }
  end

  def show_wcif
    competition = competition_from_params

    render_wcif(competition, Competition::WCIF_STABLE_VERSION)
  end

  def show_wcif_by_lifecycle
    competition = competition_from_params

    lifecycle_raw = params.require(:lifecycle_name)
    force_public = lifecycle_raw == 'public'

    lifecycle_name = lifecycle_raw
                     # backwards compatibility with legacy /wcif/public route
                     .gsub('public', 'stable')
                     .to_sym

    unless Competition::WCIF_VERSION_CATALOGUE.key?(lifecycle_name)
      return render json: {
        message: "invalid lifecycle name '#{lifecycle_name}'",
        valid_lifecycle_names: Competition::WCIF_VERSION_CATALOGUE.keys,
      }, status: :bad_request
    end

    lifecycle_version = Competition::WCIF_VERSION_CATALOGUE.fetch(lifecycle_name)

    render_wcif(competition, lifecycle_version, force_public: force_public)
  end

  def show_wcif_by_version
    competition = competition_from_params

    version_number = params.require(:version_number)
    user_version = Gem::Version.new(version_number)

    available_versions = Competition::WCIF_VERSION_CATALOGUE.values
                                                            .map { Gem::Version.new(it) }

    # The idea behind this loop is: Find all pre-defined version numbers
    #   that "match" the user's desired version by prefix:
    # - If the user passes just "2", then any version like `2.0.0` or `2.1.1` or `2.6` match
    # - If the user passes "2.1", then any version like `2.1` or `2.1.3` match
    # - If the user passes "2.1.7", then only that specific version matches
    matching_versions = available_versions.select do |version|
      version.segments.take(user_version.segments.size) == user_version.segments
    end

    if matching_versions.empty?
      return render json: {
        message: "invalid version number '#{version_number}'",
        valid_version_numbers: Competition::WCIF_VERSION_CATALOGUE.values.uniq,
        highest_version_number: available_versions.max.to_s,
        stable_version_number: Competition::WCIF_STABLE_VERSION,
      }, status: :bad_request
    end

    # Pick the highest version number that satisfies what the user requested
    best_version = matching_versions.max.to_s

    render_wcif(competition, best_version)
  end

  def update_wcif
    competition = competition_from_params
    require_can_manage!(competition)

    # Only admins can update WCIF (including schedule) after results are submitted
    require_can_admin_competitions! if competition.results_submitted?

    # We need to clean out some Rails-y stuff.
    #   Normally, this isn't a problem because you're never supposed to just use `params.permit!`
    #   without _explicitly_ sanitizing which parameters you *approve*, but WCIF is too big
    #   for any one developer's mental sanity to control that.
    # Note that none of the keys that we're "throwing away" here are currently WCIF-compliant,
    #   nor are we ever likely to introduce any of them in top-level WCIF.
    wcif = params.permit!.to_h.except(:controller, :action, :competition_id, :competition, :strict)

    wcif = wcif["_json"] || wcif

    # If the user specified a "strictness" param, then use it.
    # If not, then fall back to a default behavior where:
    #  - local environments (dev, test) are strict
    #  - other environments (most notably prod) are NOT strict right now
    # Strictness will be enforced at some time in May 2026. Signed GB 2026-05-01
    strict_schema_checks = params.key?(:strict) ? ActiveRecord::Type::Boolean.new.cast(params[:strict]) : Rails.env.local?

    competition.set_wcif!(wcif, require_user!, strict_schema_checks: strict_schema_checks)
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

  private def can_perform_action?(*oauth_scopes)
    api_user_can_perform = yield(current_api_user) && oauth_scopes.all? { doorkeeper_token.scopes.exists?(it) }
    api_user_can_perform || yield(current_user)
  end

  private def can_manage?(competition)
    can_perform_action?("manage_competitions") { it&.can_manage_competition?(competition) }
  end

  private def can_admin_competitions?
    can_perform_action?("manage_competitions") { it&.can_admin_competitions? }
  end

  private def require_scope!(scope)
    require_user!
    raise WcaExceptions::BadApiParameter.new("Missing required scope '#{scope}'") if current_api_user && doorkeeper_token.scopes.exclude?(scope) # If we deal with an OAuth user then check the scopes.
  end

  def require_can_manage!(competition)
    require_user!
    raise WcaExceptions::NotPermitted.new("Not authorized to manage competition") unless can_manage?(competition)
  end

  def require_can_admin_competitions!
    require_user!
    raise WcaExceptions::NotPermitted.new("The competition data cannot be edited after results have been submitted.") unless can_admin_competitions?
  end
end
