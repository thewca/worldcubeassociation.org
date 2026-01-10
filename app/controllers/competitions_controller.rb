# frozen_string_literal: true

class CompetitionsController < ApplicationController
  include ApplicationHelper

  PAST_COMPETITIONS_DAYS = 90
  CHECK_SCHEDULE_ASSOCIATIONS = {
    competition_events: [:rounds],
    competition_venues: {
      venue_rooms: {
        schedule_activities: [:child_activities],
      },
    },
  }.freeze

  before_action :authenticate_user!, except: %i[
    index
    show
    embedable_map
    show_podiums
    show_all_results
    show_results_by_person
    show_scrambles
  ]
  before_action -> { redirect_to_root_unless_user(:can_admin_competitions?) }, only: %i[
    admin_edit
    disconnect_payment_integration
  ]
  before_action -> { redirect_to_root_unless_user(:can_create_competitions?) }, only: [
    :new,
  ]
  before_action -> { redirect_to_root_unless_user(:can_access_senior_delegate_panel?) }, only: [
    :for_senior,
  ]
  before_action -> { redirect_to_root_unless_user(:can_manage_competition?, competition_from_params) }, only: %i[
    edit
    edit_events
    edit_schedule
    payment_integration_setup
  ]

  rescue_from WcaExceptions::ApiException do |e|
    render status: e.status, json: { error: e.to_s }.reverse_merge(e.error_details.compact)
  end

  rescue_from JSON::Schema::ValidationError do |e|
    render status: :unprocessable_content, json: {
      error: e.to_s,
      jsonProperty: e.fragments.join('.'),
      schema: e.schema.schema, # yes, unfortunately the double invocation is necessary.
    }
  end

  private def require_user_permission(action, *, is_message: false)
    permission_result = current_user&.send(action, *)

    if is_message && permission_result
      return render status: :forbidden, json: { error: permission_result }
    elsif !is_message && !permission_result
      return render status: :forbidden, json: { error: "Missing permission #{action}" }
    end

    # return: when is_message is true, the permission_result message should be empty, i.e. false-y,
    #   and the negation of an empty message is also true.
    #   When is_message is false, the permission_result should be true, i.e. the negation should be false.
    is_message == !permission_result
  end

  private def competition_from_params(includes: nil)
    Competition.includes(includes).find(params[:competition_id] || params[:id]).tap do |competition|
      raise ActionController::RoutingError.new('Not Found') unless competition.user_can_view?(current_user)

      assign_editing_user(competition)
    end
  end

  private def assign_delegate(competition)
    competition.delegates |= [current_user] if current_user.any_kind_of_delegate?
  end

  private def assign_editing_user(competition)
    competition.editing_user_id = current_user&.id
  end

  # Rubocop is unhappy about all the things we do in this controller action,
  # which is understandable.
  def index
  end

  def edit_events
    associations = CHECK_SCHEDULE_ASSOCIATIONS.merge(
      competition_events: {
        rounds: [:competition_event],
      },
    )
    @competition = competition_from_params(includes: associations)
  end

  def edit_schedule
    @competition = competition_from_params(includes: [competition_events: { rounds: { competition_event: [:event] } }, competition_venues: { venue_rooms: { schedule_activities: [:child_activities] } }])
  end

  def get_nearby_competitions(competition)
    nearby_competitions = competition.nearby_competitions_danger.to_a[0, 10]
    nearby_competitions.select!(&:confirmed?) unless current_user.can_view_hidden_competitions?
    nearby_competitions
  end

  def get_series_eligible_competitions(competition)
    series_eligible_competitions = competition.series_eligible_competitions.to_a
    series_eligible_competitions.select!(&:confirmed?) unless current_user.can_view_hidden_competitions?
    series_eligible_competitions
  end

  def get_colliding_registration_start_competitions(competition)
    colliding_registration_start_competitions = competition.colliding_registration_start_competitions.to_a
    colliding_registration_start_competitions.select!(&:confirmed?) unless current_user.can_view_hidden_competitions?
    colliding_registration_start_competitions
  end

  def show
    associations = {
      competition_venues: {
        venue_rooms: [:schedule_activities],
      },
      # FIXME: this part is triggerred by the competition menu generator when generating the psychsheet event list, should we care?
      competition_events: {
        # NOTE: we hit this association through competition.has_fees?, which then calls 'has_fee?' on each competition_event, which then use the competition to get the currency.
        competition: [],
        event: [],
        # NOTE: we eventually hit the rounds->competition->competition_event in the TimeLimit 'to_s' method when having cumulative limit across rounds
        rounds: {
          competition: { rounds: [:competition_event] },
          competition_event: [],
        },
      },
      rounds: {
        # Used by TimeLimit, but this is a weird includes...
        competition: { rounds: [:competition_event] },
      },
    }
    @competition = competition_from_params(includes: associations)
    respond_to do |format|
      format.html
      format.pdf do
        unless @competition.any_venues?
          flash[:danger] = t('.no_schedule')
          return redirect_to competition_path(@competition)
        end
        @colored_schedule = params.key?(:with_colors)

        # Manually cache the pdf on:
        #   - competiton.updated_at (touched by any change through WCIF)
        #   - locale
        #   - color or n&b
        # We have a scheduled job to clear out old files
        cached_path = helpers.path_to_cached_pdf(@competition, @colored_schedule)

        @stream_raw = params[:raw_html] == '0xPlaywright'

        if @stream_raw
          return render content_type: 'text/html'
        elsif !File.exist?(cached_path)
          helpers.create_pdfs_directory

          raw_content = self.render_to_string

          helpers.playwright_connection do |browser|
            page = browser.new_page

            # Inject the raw HTML and wait until it finished loading all network assets
            page.set_content(raw_content, waitUntil: 'networkidle')

            # Wait until the WOFF2 fonts have been extracted
            page.evaluate_handle('document.fonts.ready')

            page.pdf(
              path: cached_path,
              format: 'A4',
              landscape: true,
              # Use `scale` and `margins` to imitate WkHtmlToPdf look and feel
              scale: 0.8,
              margin: { top: '8mm', bottom: '8.5mm', left: '10mm', right: '10mm' },
            )
          end
        end

        File.open(cached_path) do |f|
          send_data f.read, filename: "#{helpers.pdf_name(@competition)}.pdf",
                            type: "application/pdf", disposition: "inline"
        end
      end
      format.ics do
        calendar = @competition.to_ics
        render plain: calendar.to_ical, content_type: 'text/calendar'
      end
    end
  end

  def new
    @competition = Competition.new(
      competitor_limit_enabled: true,
      base_entry_fee_lowest_denomination: 0,
      guests_entry_fee_lowest_denomination: 0,
    )

    assign_editing_user(@competition)
    assign_delegate(@competition)
  end

  def admin_edit
    @competition = competition_from_params(includes: CHECK_SCHEDULE_ASSOCIATIONS)
    @competition_admin_view = true

    render :edit
  end

  def edit
    @competition = competition_from_params(includes: CHECK_SCHEDULE_ASSOCIATIONS)
    @competition_admin_view = false

    render :edit
  end

  def payment_integration_manual_setup
    @competition = competition_from_params
    @account_details = @competition.payment_account_for(:manual)&.account_details
  end

  def payment_integration_setup
    @competition = competition_from_params

    not_connected_integrations = CompetitionPaymentIntegration::AVAILABLE_INTEGRATIONS.keys - @competition.connected_payment_integration_types

    @cpi_onboarding_urls = not_connected_integrations.index_with do |cpi_type|
      connector = CompetitionPaymentIntegration::AVAILABLE_INTEGRATIONS[cpi_type].safe_constantize
      connector&.generate_onboarding_link(@competition.id)
    end
  end

  def connect_payment_integration
    competition = competition_from_params
    payment_integration = params.require(:payment_integration).to_sym

    raise ActionController::RoutingError.new('Not Found') unless current_user&.can_manage_competition?(competition)

    if payment_integration == :paypal && PaypalInterface.paypal_disabled?
      flash[:error] = 'PayPal is not yet available in production environments'
      return redirect_to competition_payment_integration_setup_path(competition)
    end

    if payment_integration == :manual && ManualPaymentIntegration.manual_payments_disabled?
      flash[:error] = 'Manual payments are not yet available in production environments'
      return redirect_to competition_payment_integration_setup_path(competition)
    end

    if CompetitionPaymentIntegration::AVAILABLE_INTEGRATIONS[payment_integration].nil?
      flash[:error] = "Payment Integration #{payment_integration} not found"
      return redirect_to competition_payment_integration_setup_path(competition)
    end

    connector = CompetitionPaymentIntegration::AVAILABLE_INTEGRATIONS[payment_integration].safe_constantize
    integration_reference = connector&.connect_integration(params)

    raise ActionController::RoutingError.new("No integration reference submitted") if integration_reference.blank?

    # Small hack: We allow de-facto updates by "re-connecting" manual payment in the UI.
    #   This is done to allow edits to a Manual CPI, but coding a proper `PATCH` form
    #   would break the mold of the usual OAuth flow with "proper" payment providers.
    existing_manual_cpi = competition.payment_account_for(:manual) if payment_integration == :manual
    if existing_manual_cpi&.account_details.present?
      existing_manual_cpi.update(**integration_reference.account_details)
    else
      competition.competition_payment_integrations.build(connected_account: integration_reference)
    end

    if competition.save
      flash[:success] = t('payments.payment_setup.account_connected', provider: t("payments.payment_providers.#{payment_integration}"))
    else
      flash[:danger] = t('payments.payment_setup.account_not_connected', provider: t("payments.payment_providers.#{payment_integration}"))
    end

    redirect_to competition_payment_integration_setup_path(competition)
  end

  def stripe_connect
    # Stripe is very strict about OAuth. We need to specify **hard-coded** return URLs in the Stripe Dashboard manually.
    # This means that we cannot use the default connect path above, because that contains the competition ID in the URL
    #   meaning that we cannot hard-code every CompetitionID in existence in the Stripe Dashboard.
    # Luckily, Stripe _does_ allow to pass a "state" (which should normally be a CSRF token) that we can abuse to
    #   transmit the competition ID instead. So we use this static URL for OAuth,
    #   and then for code reuse we just redirect internally :)
    competition_id = params.require(:state)
    competition = Competition.find(competition_id)

    raise ActionController::RoutingError.new('Not Found') unless current_user&.can_manage_competition?(competition)

    redirect_to competition_connect_payment_integration_path(
      competition_id,
      payment_integration: :stripe,
      # see https://docs.stripe.com/connect/oauth-reference#get-authorize-response
      params: params.permit(:code, :scope, :state),
    )
  end

  def disconnect_payment_integration
    competition = competition_from_params
    payment_integration = params.require(:payment_integration)

    if payment_integration == "paypal" && PaypalInterface.paypal_disabled?
      flash[:error] = 'PayPal is not yet available in production environments'
      return redirect_to root_url
    end

    competition.disconnect_payment_integration(payment_integration.to_sym)

    if competition.payment_integration_connected?(payment_integration.to_sym)
      flash[:danger] = t('payments.payment_setup.account_disconnected_failure', provider: t("payments.payment_providers.#{payment_integration}"))
    else
      flash[:success] = t('payments.payment_setup.account_disconnected_success', provider: t("payments.payment_providers.#{payment_integration}"))
    end

    redirect_to competition_payment_integration_setup_path(competition)
  end

  def clone_competition
    competition_to_clone = competition_from_params
    @competition = competition_to_clone.build_clone
    assign_delegate(@competition)
    render :new
  end

  def competition_form_nearby_json(competition, other_comp)
    comp_link = if current_user.can_admin_results?
                  ActionController::Base.helpers.link_to(other_comp.name, competition_admin_edit_path(other_comp.id), target: "_blank", rel: "noopener")
                else
                  ActionController::Base.helpers.link_to(other_comp.name, competition_path(other_comp.id))
                end

    days_until = competition.days_until_competition?(other_comp)

    {
      danger: competition.dangerously_close_to?(other_comp),
      id: other_comp.id,
      name: other_comp.name,
      nameLink: comp_link,
      confirmed: other_comp.confirmed?,
      delegates: users_to_sentence(other_comp.delegates),
      daysUntil: days_until,
      startDate: other_comp.start_date,
      endDate: other_comp.end_date,
      location: "#{other_comp.city_name}, #{other_comp.country_id}",
      distance: {
        km: competition.kilometers_to(other_comp).round(2),
        from: {
          lat: other_comp.latitude_degrees,
          long: other_comp.longitude_degrees,
        },
        to: {
          lat: competition.latitude_degrees,
          long: competition.longitude_degrees,
        },
      },
      limit: other_comp.competitor_limit_enabled ? other_comp.competitor_limit : "",
      competitors: other_comp.probably_over? ? other_comp.results.select('DISTINCT person_id').count : "",
      events: other_comp.events.map(&:id),
      coordinates: {
        lat: other_comp.latitude_degrees,
        long: other_comp.longitude_degrees,
      },
      series: other_comp.competition_series&.to_form_data,
    }
  end

  def nearby_competitions_json
    permitted_params = params.permit(:id, :start_date, :end_date, :latitude_degrees, :longitude_degrees)
    competition = Competition.new(permitted_params)

    competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    nearby_competitions = get_nearby_competitions(competition)

    render json: nearby_competitions.map { |c| competition_form_nearby_json(competition, c) }
  end

  def series_eligible_competitions_json
    permitted_params = params.permit(:id, :start_date, :end_date, :latitude_degrees, :longitude_degrees)
    competition = Competition.new(permitted_params)

    competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    series_eligible_competitions = get_series_eligible_competitions(competition)
    render json: series_eligible_competitions.map { |c| competition_form_nearby_json(competition, c) }
  end

  def competition_form_registration_collision_json(competition, other_comp)
    comp_link = if current_user.can_admin_results?
                  ActionController::Base.helpers.link_to(other_comp.name, competition_admin_edit_path(other_comp.id), target: "_blank", rel: "noopener")
                else
                  ActionController::Base.helpers.link_to(other_comp.name, competition_path(other_comp.id))
                end

    {
      id: other_comp.id,
      name: other_comp.name,
      nameLink: comp_link,
      confirmed: other_comp.confirmed?,
      delegates: users_to_sentence(other_comp.delegates),
      registrationOpen: other_comp.registration_open,
      minutesUntil: competition.minutes_until_other_registration_starts(other_comp),
      cityName: other_comp.city_name,
      countryId: other_comp.country_id,
      events: other_comp.events.map(&:id),
    }
  end

  def registration_collisions_json
    permitted_params = params.permit(:id, :registration_open)
    competition = Competition.new(permitted_params)

    competition.valid? # unwrap data hidden behind validations
    collisions = get_colliding_registration_start_competitions(competition)

    render json: collisions.map { |c| competition_form_registration_collision_json(competition, c) }
  end

  def calculate_dues
    country_iso2 = Country.find_by(id: params[:countryId])&.iso2
    per_competitor_dues = DuesCalculator.dues_per_competitor(
      country_iso2,
      params[:baseEntryFee].to_i,
      params[:currencyCode],
    )
    per_competitor_dues_in_lowest_denomination = per_competitor_dues&.cents

    render json: {
      dues_value: per_competitor_dues_in_lowest_denomination,
    }
  end

  def show_podiums
    @competition = competition_from_params
  end

  def show_all_results
    @competition = competition_from_params
  end

  def show_results_by_person
    @competition = competition_from_params
  end

  def show_scrambles
    @competition = competition_from_params
  end

  def embedable_map
    # NOTE: by default rails has a SAMEORIGIN X-Frame-Options
    @query = params.require(:q)
    render layout: false
  end

  def bookmark
    @competition = competition_from_params
    BookmarkedCompetition.find_or_create_by(competition: @competition, user: current_user)
    Rails.cache.delete("#{current_user.id}-competitions-bookmarked")
    head :ok
  end

  def unbookmark
    @competition = competition_from_params
    BookmarkedCompetition.where(competition: @competition, user: current_user).destroy_all
    Rails.cache.delete("#{current_user.id}-competitions-bookmarked")
    head :ok
  end

  before_action -> { require_user_permission(:can_create_competitions?) }, only: [:create]
  def create
    competition = Competition.new

    form_data = params_for_competition_form
    competition.set_form_data(form_data, current_user)

    if competition.save
      competition.organizers.each do |organizer|
        CompetitionsMailer.notify_organizer_of_addition_to_competition(current_user, competition, organizer).deliver_later
      end

      render json: { status: "ok", message: t('competitions.messages.create_success'), redirect: edit_competition_path(competition) }
    else
      render status: :bad_request, json: competition.form_errors
    end
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:update]
  def update
    competition = competition_from_params

    admin_view_param = params.delete(:adminView)

    competition_admin_view = ActiveRecord::Type::Boolean.new.cast(admin_view_param) && current_user.can_admin_competitions?
    competition_organizer_view = !competition_admin_view

    old_organizers = competition.organizers.to_a

    form_data = params_for_competition_form

    #####
    # HACK BECAUSE WE DON'T HAVE PERSISTENT COMPETITION IDS
    #####

    # Need to delete the ID in this first update pass because it's our primary key (yay legacy code!)
    persisted_id = competition.id
    new_id = nil # Initialize under the assumption that nothing changed.

    form_id = form_data[:competitionId]
    new_id = form_id unless form_id == persisted_id

    # In the first update pass, we need to pretend like the ID never changed.
    # Changing ID needs a special hack which we handle below.
    form_data[:competitionId] = persisted_id

    #####
    # HACK END
    #####

    competition.set_form_data(form_data, current_user)

    if competition.save
      # Automatically compute the cellName and ID for competitions with a short name.
      if !competition.confirmed? && competition_organizer_view && competition.name.length <= Competition::MAX_CELL_NAME_LENGTH
        competition.create_id_and_cell_name(force_override: true)

        # Try to update the ID only if it _actually_ changed
        new_id = competition.id unless competition.id == persisted_id
      end

      if new_id && !competition.update(competition_id: new_id)
        # Changing the competition id breaks all our associations, and our view
        # code was not written to handle this. Rather than trying to update our view
        # code, just revert the attempted id change. The user will have to deal with
        # editing the ID text box manually. This will go away once we have proper
        # immutable ids for competitions.
        return render json: {
          status: "ok",
          redirect: competition_admin_view ? competition_admin_edit_path(competition) : edit_competition_path(competition),
        }
      end

      new_organizers = competition.organizers - old_organizers
      removed_organizers = old_organizers - competition.organizers

      new_organizers.each do |new_organizer|
        CompetitionsMailer.notify_organizer_of_addition_to_competition(current_user, competition, new_organizer).deliver_later
      end

      removed_organizers.each do |removed_organizer|
        CompetitionsMailer.notify_organizer_of_removal_from_competition(current_user, competition, removed_organizer).deliver_later
      end

      response_data = { status: "ok", message: t('.save_success') }

      if persisted_id != competition.id
        response_data[:redirect] = competition_admin_view ? competition_admin_edit_path(competition) : edit_competition_path(competition)
      end

      render json: response_data
    else
      render status: :bad_request, json: competition.form_errors
    end
  end

  private def params_for_competition_form
    # we're quite lax about reading params, because set_form_data! on the competition object does a comprehensive JSON-Schema check.
    #   Also, listing _all_ the possible params to `permit` here is annoying because the Competition model has _way_ too many columns.
    #   So we "only" remove the ActionController values, as well as all route params manually.
    params.permit!.to_h.except(:controller, :action, :id, :competition, :format)
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:announcement_data]

  def announcement_data
    competition = competition_from_params

    render json: competition.form_announcement_data
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:user_preferences]

  def user_preferences
    competition = competition_from_params

    render json: competition.form_user_preferences(current_user)
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:confirmation_data]

  def confirmation_data
    competition = competition_from_params

    render json: competition.form_confirmation_data(current_user)
  end

  before_action -> { require_user_permission(:can_admin_competitions?) }, only: [:update_confirmation_data]

  def update_confirmation_data
    competition = competition_from_params

    competition.confirmed = params[:isConfirmed] if params.key?(:isConfirmed)
    competition.show_at_all = params[:isVisible] if params.key?(:isVisible)

    if competition.save
      render json: {
        status: "ok",
        data: competition.form_confirmation_data(current_user),
      }
    else
      render status: :bad_request, json: competition.errors
    end
  end

  before_action -> { require_user_permission(:get_cannot_delete_competition_reason, competition_from_params, is_message: true) }, only: [:destroy]

  def destroy
    competition = competition_from_params
    competition.destroy

    render json: { status: "ok", message: t('competitions.update.delete_success') }
  end

  before_action -> { require_user_permission(:can_confirm_competition?, competition_from_params) }, only: [:confirm]

  def confirm
    competition = competition_from_params

    competition.confirmed = true

    if competition.save
      CompetitionsMailer.notify_wcat_of_confirmed_competition(current_user, competition).deliver_later

      competition.organizers.each do |organizer|
        CompetitionsMailer.notify_organizer_of_confirmed_competition(current_user, competition, organizer).deliver_later
      end

      render json: {
        status: "ok",
        message: t('competitions.update.confirm_success'),
        data: competition.form_confirmation_data(current_user),
      }
    else
      render status: :bad_request, json: competition.form_errors
    end
  end

  before_action -> { require_user_permission(:can_admin_competitions?) }, only: [:announce]

  def announce
    competition = competition_from_params

    return render json: { error: "Already announced" }, status: :bad_request if competition.announced?

    competition.update!(announced_at: Time.now, announced_by: current_user.id, show_at_all: true)

    competition.organizers.each do |organizer|
      CompetitionsMailer.notify_organizer_of_announced_competition(competition, organizer).deliver_later
    end

    render json: {
      status: "ok",
      message: t('competitions.messages.announced_success'),
      data: competition.form_announcement_data,
    }
  end

  before_action -> { require_user_permission(:can_admin_competitions?) }, only: [:cancel_or_uncancel]

  def cancel_or_uncancel
    competition = competition_from_params

    undo = params[:undo]
    undo = ActiveRecord::Type::Boolean.new.cast(undo) if undo.present?

    if undo
      if competition.cancelled?
        competition.update!(cancelled_at: nil, cancelled_by: nil)

        render json: {
          status: "ok",
          message: t('competitions.messages.uncancel_success'),
          data: competition.form_announcement_data,
        }
      else
        render json: { error: t('competitions.messages.uncancel_failure') }, status: :bad_request
      end
    elsif competition.can_be_cancelled?
      competition.update!(cancelled_at: Time.now, cancelled_by: current_user.id)
      render json: {
        status: "ok",
        message: t('competitions.messages.cancel_success'),
        data: competition.form_announcement_data,
      }
    else
      render json: { error: t('competitions.messages.cancel_failure') }, status: :bad_request
    end
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:close_full_registration]

  def close_full_registration
    competition = competition_from_params

    if competition.orga_can_close_reg_full_limit?
      competition.update!(
        # kill switch to stop a validation that disallows "now or past" closing dates
        closing_full_registration: true,
        registration_close: Time.now,
      )

      render json: {
        status: "ok",
        message: t('competitions.messages.orga_closed_reg_success'),
        data: competition.form_announcement_data,
      }
    else
      render json: { error: t('competitions.messages.orga_closed_reg_failure') }, status: :bad_request
    end
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:close_full_registration]

  def update_user_notifications
    competition = competition_from_params

    receive_emails_flag = params.require(:receive_registration_emails)
    receive_registration_emails = ActiveModel::Type::Boolean.new.cast(receive_emails_flag)

    competition.receive_registration_emails = receive_registration_emails
    competition.save!

    render json: { status: "ok", data: competition.form_user_preferences(current_user) }
  end

  def my_competitions
    @my_competitions, @my_registrations = current_user.my_competitions
  end

  def for_senior
    user_id = params[:user_id] || current_user.id
    @user = User.find(user_id)
    @competitions = @user.subordinate_delegates.map(&:delegated_competitions).flatten.uniq.reject(&:probably_over?).sort_by { |c| c.start_date || (Date.today + 20.years) }.reverse
  end
end
