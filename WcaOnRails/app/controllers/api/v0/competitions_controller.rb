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

  def show
    competition = competition_from_params

    if stale?(competition)
      options = {
        only: %w[id name website start_date registration_open registration_close
                 announced_at cancelled_at end_date competitor_limit
                 extra_registration_requirements enable_donations refund_policy_limit_date event_change_deadline_date waiting_list_deadline_date on_the_spot_registration on_the_spot_entry_fee_lowest_denomination qualification_results
                 event_restrictions base_entry_fee_lowest_denomination currency_code allow_registration_edits allow_registration_self_delete_after_acceptance allow_registration_without_qualification refund_policy_percent
                 use_wca_registration guests_per_registration_limit venue contact force_comment_in_registration use_wca_registration external_registration_page guests_entry_fee_lowest_denomination guest_entry_status information],
        methods: %w[url website short_name city venue_address venue_details latitude_degrees
                    longitude_degrees country_iso2 event_ids
                    registration_opened? main_event_id number_of_bookmarks using_stripe_payments? uses_qualification? uses_cutoff?],
        include: %w[delegates organizers tabs],
      }
      render json: competition.as_json(options)
    end
  end

  def schedule
    competition = competition_from_params
    render json: competition.schedule_wcif
  end

  def results
    competition = competition_from_params
    render json: competition.results
  end

  def event_results
    competition = competition_from_params(associations: [:rounds])
    event = Event.c_find!(params[:event_id])
    results_by_round = competition.results
                                  .where(eventId: event.id)
                                  .group_by(&:round_type)
                                  .sort_by { |round_type, _| -round_type.rank }
    rounds = results_by_round.map do |round_type, results|
      # I think all competitions now have round data, but let's be cautious
      # and assume they may not.
      # round data.
      round = competition.find_round_for(event.id, round_type.id)
      {
        id: round&.id,
        roundTypeId: round_type.id,
        # Also include the (localized) name here, we don't have i18n in js yet.
        name: round&.name || "#{event.name} #{round_type.name}",
        results: results.sort_by { |r| [r.pos, r.personName] },
      }
    end
    render json: {
      id: event.id,
      # Also include the (localized) name here, we don't have i18n in js yet.
      name: event.name,
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
    scrambles_by_round = competition.scrambles
                                    .where(eventId: event.id)
                                    .group_by(&:round_type)
                                    .sort_by { |round_type, _| -round_type.rank }
    rounds = scrambles_by_round.map do |round_type, scrambles|
      {
        id: round_type,
        # Also include the (localized) name here, we don't have i18n in js yet.
        name: round_type.name,
        scrambles: scrambles,
      }
    end
    render json: {
      id: event.id,
      # Also include the (localized) name here, we don't have i18n in js yet.
      name: event.name,
      rounds: rounds,
    }
  end

  def competitors
    competition = competition_from_params
    render json: competition.competitors
  end

  def registrations
    competition = competition_from_params
    render json: competition.registrations.accepted.includes(:events)
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
    if stale?(competition, public: true)
      render json: Rails.cache.fetch(cache_key, expires_in: 5.minutes) {
        competition.to_wcif
      }
    end
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

  private def competition_from_params(associations: {})
    id = params[:competition_id] || params[:id]
    competition = Competition.includes(associations).find_by_id(id)

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
