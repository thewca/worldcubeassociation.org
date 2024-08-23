# frozen_string_literal: true

class Api::Internal::V1::CompetitionsController < Api::Internal::V1::ApiController
  # We are using our own authentication method with vault
  protect_from_forgery except: [:show]

  def show
    competition = competition_from_params

    if stale?(competition)
      options = {
        only: %w[id name website start_date registration_open registration_close announced_at cancelled_at end_date competitor_limit
                 extra_registration_requirements enable_donations refund_policy_limit_date event_change_deadline_date waiting_list_deadline_date
                 on_the_spot_registration on_the_spot_entry_fee_lowest_denomination qualification_results event_restrictions
                 base_entry_fee_lowest_denomination currency_code allow_registration_edits allow_registration_self_delete_after_acceptance
                 allow_registration_without_qualification refund_policy_percent use_wca_registration guests_per_registration_limit venue contact
                 force_comment_in_registration use_wca_registration external_registration_page guests_entry_fee_lowest_denomination guest_entry_status
                 information events_per_registration_limit],
        methods: %w[url website short_name city venue_address venue_details latitude_degrees longitude_degrees country_iso2 event_ids registration_currently_open?
                    main_event_id number_of_bookmarks using_payment_integrations? uses_qualification? uses_cutoff? competition_series_ids],
        include: %w[delegates organizers tabs],
      }
      render json: competition.as_json(options)
    end
  end

  private def competition_from_params
    id = params[:competition_id]
    competition = Competition.find_by_id(id)

    raise WcaExceptions::NotFound.new("Competition with id #{id} not found") unless competition
    competition
  end
end
