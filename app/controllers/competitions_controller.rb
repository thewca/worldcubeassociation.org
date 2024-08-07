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

  before_action :authenticate_user!, except: [
    :index,
    :show,
    :embedable_map,
    :show_podiums,
    :show_all_results,
    :show_results_by_person,
    :show_scrambles,
  ]
  before_action -> { redirect_to_root_unless_user(:can_admin_competitions?) }, only: [
    :admin_edit,
    :disconnect_payment_integration,
  ]
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }, only: [
    :post_results,
  ]
  before_action -> { redirect_to_root_unless_user(:can_create_competitions?) }, only: [
    :new,
  ]
  before_action -> { redirect_to_root_unless_user(:can_access_senior_delegate_panel?) }, only: [
    :for_senior,
  ]
  before_action -> { redirect_to_root_unless_user(:can_manage_competition?, competition_from_params) }, only: [
    :edit,
    :edit_events,
    :edit_schedule,
    :payment_integration_setup,
  ]

  rescue_from WcaExceptions::ApiException do |e|
    render status: e.status, json: { error: e.to_s }
  end

  rescue_from JSON::Schema::ValidationError do |e|
    render status: :unprocessable_entity, json: {
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
      unless competition.user_can_view?(current_user)
        raise ActionController::RoutingError.new('Not Found')
      end

      assign_editing_user(competition)
    end
  end

  private def assign_delegate(competition)
    competition.delegates |= [current_user] if current_user.any_kind_of_delegate?
  end

  private def assign_editing_user(competition)
    competition.editing_user_id = current_user&.id
  end

  # Normalizes the params that old links to index still work.
  private def support_old_links!
    params[:display].downcase! if params[:display] # 'List' -> 'list', 'Map' -> 'map'

    if params[:years] == "all"
      params[:state] = "past"
      params[:year] = "all years"
    elsif params[:years].to_i >= Date.today.year # to_i: 'If there is not a valid number at the start of str, 0 is returned.' - RubyDoc
      params[:state] = "past"
      params[:year] = params[:years]
    end
    params[:years] = nil
  end

  # Rubocop is unhappy about all the things we do in this controller action,
  # which is understandable.
  def index
    support_old_links!

    # Default params
    params[:event_ids] ||= []
    params[:region] ||= "all"
    unless %w(past present recent by_announcement custom).include? params[:state]
      params[:state] = "present"
    end
    params[:year] ||= "all years"
    params[:status] ||= "all"
    @display = %w(list map admin).include?(params[:display]) ? params[:display] : "list"

    # Facebook adds indices to the params automatically when redirecting.
    # See: https://github.com/thewca/worldcubeassociation.org/issues/472
    if params[:event_ids].is_a?(ActionController::Parameters)
      params[:event_ids] = params[:event_ids].values
    end

    @past_selected = params[:state] == "past"
    @present_selected = params[:state] == "present"
    @recent_selected = params[:state] == "recent"
    @by_announcement_selected = params[:state] == "by_announcement"
    @custom_selected = params[:state] == "custom"
    @show_cancelled = params[:show_cancelled] == "on"
    @show_registration_status = params[:show_registration_status] == "on"

    @years = ["all years"] + Competition.non_future_years

    if params[:delegate].present?
      delegate = User.find(params[:delegate])
      @competitions = delegate.delegated_competitions
    else
      @competitions = Competition
    end

    unless @show_cancelled
      @competitions = @competitions.not_cancelled
    end

    @competitions = @competitions.includes(:country).where(showAtAll: true)
    @competitions = if @by_announcement_selected
                      @competitions.order_by_announcement_date
                    else
                      @competitions.order_by_date
                    end

    if @present_selected || @by_announcement_selected
      @competitions = @competitions.not_over
    elsif @recent_selected
      @competitions = @competitions.where("end_date between ? and ?", (Date.today - Competition::RECENT_DAYS), Date.today).reverse_order
    elsif @custom_selected
      from_date = Date.safe_parse(params[:from_date])
      to_date = Date.safe_parse(params[:to_date])
      if from_date || to_date
        @competitions = @competitions.where("start_date <= ?", to_date) if to_date
        @competitions = @competitions.where("end_date >= ?", from_date) if from_date
      else
        @competitions = Competition.none
      end
    else
      @competitions = @competitions.where("end_date < ?", Date.today).reverse_order
      unless params[:year] == "all years"
        @competitions = @competitions.where("YEAR(start_date) = :comp_year", comp_year: params[:year])
      end
    end

    if @display == 'admin'
      @competitions = @competitions.includes(:delegates, :delegate_report)
    end

    unless params[:region] == "all"
      @competitions = @competitions.belongs_to_region(params[:region])
    end

    if params[:search].present?
      params[:search].split.each do |part|
        @competitions = @competitions.contains(part)
      end
    end

    unless params[:event_ids].empty?
      params[:event_ids].each do |event_id|
        @competitions = @competitions.has_event(event_id)
      end
    end

    unless params[:status] == "all"
      days = (params[:status] == "warning" ? Competition::REPORT_AND_RESULTS_DAYS_WARNING : Competition::REPORT_AND_RESULTS_DAYS_DANGER)
      @competitions = @competitions.select { |competition| competition.pending_results_or_report(days) }
    end

    @enable_react = params[:beta]&.to_s == '0xDbOverload'

    respond_to do |format|
      format.html {}
      format.js do
        # We change the browser's history when replacing url after an Ajax request.
        # So we must prevent a browser from caching the JavaScript response.
        # It's necessary because if the browser caches the response, the user will see a JavaScript response
        # when he clicks browser back/forward buttons.
        response.headers["Cache-Control"] = "no-cache, no-store"
        render 'index', locals: { current_path: request.original_fullpath }
      end
    end
  end

  def post_results
    comp = competition_from_params
    if ComputeAuxiliaryData.in_progress?
      flash[:danger] = t('competitions.messages.computing_auxiliary_data')
      return redirect_to competition_admin_import_results_path(comp)
    end

    unless comp.results.any?
      flash[:danger] = t('competitions.messages.no_results')
      return redirect_to competition_admin_import_results_path(comp)
    end

    if comp.main_event && comp.results.where(eventId: comp.main_event_id).empty?
      flash[:danger] = t('competitions.messages.no_main_event_results', event_name: comp.main_event.name)
      return redirect_to competition_admin_import_results_path(comp)
    end

    if comp.results_posted?
      flash[:danger] = t('competitions.messages.results_already_posted')
      return redirect_to competition_admin_import_results_path(comp)
    end

    ActiveRecord::Base.transaction do
      # It's important to clearout the 'posting_by' here to make sure
      # another WRT member can start posting other results.
      comp.update!(results_posted_at: Time.now, results_posted_by: current_user.id, posting_by: nil)
      comp.competitor_users.each { |user| user.notify_of_results_posted(comp) }
      comp.registrations.accepted.each { |registration| registration.user.maybe_assign_wca_id_by_results(comp) }
    end

    flash[:success] = t('competitions.messages.results_posted')
    redirect_to competition_admin_import_results_path(comp)
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
    payment_integration = params.require(:payment_integration)

    unless current_user&.can_manage_competition?(competition)
      raise ActionController::RoutingError.new('Not Found')
    end

    if payment_integration == 'paypal' && PaypalInterface.paypal_disabled?
      flash[:error] = 'PayPal is not yet available in production environments'
      return redirect_to competitions_payment_setup_path(competition)
    end

    connector = CompetitionPaymentIntegration::AVAILABLE_INTEGRATIONS[payment_integration.to_sym].safe_constantize
    account_reference = connector&.connect_account(params)

    unless account_reference.present?
      raise ActionController::RoutingError.new("Payment Integration #{payment_integration} not Found")
    end

    competition.competition_payment_integrations.new(connected_account: account_reference)

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

    unless current_user&.can_manage_competition?(competition)
      raise ActionController::RoutingError.new('Not Found')
    end

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
    if current_user.can_admin_results?
      comp_link = ActionController::Base.helpers.link_to(other_comp.name, competition_admin_edit_path(other_comp.id), target: "_blank")
    else
      comp_link = ActionController::Base.helpers.link_to(other_comp.name, competition_path(other_comp.id))
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
      location: "#{other_comp.cityName}, #{other_comp.countryId}",
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
      competitors: other_comp.is_probably_over? ? other_comp.results.select('DISTINCT personId').count : "",
      events: other_comp.events.map { |event|
        event.id
      },
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
    if current_user.can_admin_results?
      comp_link = ActionController::Base.helpers.link_to(other_comp.name, competition_admin_edit_path(other_comp.id), target: "_blank")
    else
      comp_link = ActionController::Base.helpers.link_to(other_comp.name, competition_path(other_comp.id))
    end

    {
      id: other_comp.id,
      name: other_comp.name,
      nameLink: comp_link,
      confirmed: other_comp.confirmed?,
      delegates: users_to_sentence(other_comp.delegates),
      registrationOpen: other_comp.registration_open,
      minutesUntil: competition.minutes_until_other_registration_starts(other_comp),
      cityName: other_comp.cityName,
      countryId: other_comp.countryId,
      events: other_comp.events.map { |event|
        event.id
      },
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
    country_iso2 = Country.find_by(id: params[:country_id])&.iso2
    multiplier = ActiveRecord::Type::Boolean.new.cast(params[:competitor_limit_enabled]) ? params[:competitor_limit].to_i : 1
    total_dues = DuesCalculator.dues_for_n_competitors(country_iso2, params[:base_entry_fee_lowest_denomination].to_i, params[:currency_code], multiplier)
    render json: {
      dues_value: total_dues.present? ? total_dues.format : nil,
    }
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
      format.html do
      end
      format.pdf do
        unless @competition.has_schedule?
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
        begin
          File.open(cached_path) do |f|
            send_data f.read, filename: "#{helpers.pdf_name(@competition)}.pdf",
                              type: "application/pdf", disposition: "inline"
          end
        rescue Errno::ENOENT
          # This exception occurs when the file doesn't exist: let's create it!
          helpers.create_pdfs_directory
          render pdf: helpers.pdf_name(@competition), orientation: "Landscape",
                 save_to_file: cached_path, disposition: "inline"
        end
      end
      format.ics do
        calendar = @competition.to_ics
        render plain: calendar.to_ical, content_type: 'text/calendar'
      end
    end
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
    BookmarkedCompetition.where(competition: @competition, user: current_user).each(&:destroy!)
    Rails.cache.delete("#{current_user.id}-competitions-bookmarked")
    head :ok
  end

  # Enables the New Registration Service for a Competition
  def enable_v2
    @competition = competition_from_params
    if EnvConfig.WCA_LIVE_SITE? || @competition.registration_currently_open?
      flash.now[:danger] = t('competitions.messages.cannot_activate_v2')
      return redirect_to competition_path(@competition)
    end
    @competition.enable_v2_registrations!
    redirect_to competition_path(@competition)
  end

  before_action -> { require_user_permission(:can_create_competitions?) }, only: [:create]

  def create
    competition = Competition.new

    # we're quite lax about reading params, because set_form_data! below does a comprehensive JSON-Schema check.
    form_data = params.permit!.to_h
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

    # we're quite lax about reading params, because set_form_data! below does a comprehensive JSON-Schema check.
    form_data = params.permit!.to_h

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

        # Save the newly computed cellName without breaking the ID associations
        # (which in turn is handled by a hack in the next if-block below)
        competition.with_old_id { competition.save! }

        # Try to update the ID only if it _actually_ changed
        new_id = competition.id unless competition.id == persisted_id
      end

      if new_id && !competition.update(id: new_id)
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

      response_data = { status: "ok", message: t('competitions.update.save_success') }

      if persisted_id != competition.id
        response_data[:redirect] = competition_admin_view ? competition_admin_edit_path(competition) : edit_competition_path(competition)
      end

      render json: response_data
    else
      render status: :bad_request, json: competition.form_errors
    end
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:announcement_data]

  def announcement_data
    competition = competition_from_params

    render json: {
      isAnnounced: competition.announced?,
      announcedBy: competition.announced_by_user&.name,
      announcedAt: competition.announced_at&.iso8601,
      isCancelled: competition.cancelled?,
      canBeCancelled: competition.can_be_cancelled?,
      cancelledBy: competition.cancelled_by_user&.name,
      cancelledAt: competition.cancelled_at&.iso8601,
      isRegistrationPast: competition.registration_past?,
      isRegistrationFull: competition.registration_full?,
      canCloseFullRegistration: competition.orga_can_close_reg_full_limit?,
    }
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:user_preferences]

  def user_preferences
    competition = competition_from_params

    render json: {
      isReceivingNotifications: competition.receiving_registration_emails?(current_user.id),
    }
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:announcement_data]

  def confirmation_data
    competition = competition_from_params

    render json: {
      canConfirm: current_user.can_confirm_competition?(competition),
      cannotDeleteReason: current_user.get_cannot_delete_competition_reason(competition),
    }
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

      render json: { status: "ok", message: t('competitions.update.confirm_success') }
    else
      render status: :bad_request, json: competition.form_errors
    end
  end

  before_action -> { require_user_permission(:can_admin_competitions?) }, only: [:announce]

  def announce
    competition = competition_from_params

    if competition.announced?
      return render json: { error: "Already announced" }
    end

    competition.update!(announced_at: Time.now, announced_by: current_user.id)

    competition.organizers.each do |organizer|
      CompetitionsMailer.notify_organizer_of_announced_competition(competition, organizer).deliver_later
    end

    render json: { status: "ok", message: t('competitions.messages.announced_success') }
  end

  before_action -> { require_user_permission(:can_admin_competitions?) }, only: [:cancel_or_uncancel]

  def cancel_or_uncancel
    competition = competition_from_params

    undo = params[:undo]
    undo = ActiveRecord::Type::Boolean.new.cast(undo) if undo.present?

    if undo
      if competition.cancelled?
        competition.update!(cancelled_at: nil, cancelled_by: nil)
        render json: { status: "ok", message: t('competitions.messages.uncancel_success') }
      else
        render json: { error: t('competitions.messages.uncancel_failure') }, status: :bad_request
      end
    else
      if competition.can_be_cancelled?
        competition.update!(cancelled_at: Time.now, cancelled_by: current_user.id)
        render json: { status: "ok", message: t('competitions.messages.cancel_success') }
      else
        render json: { error: t('competitions.messages.cancel_failure') }, status: :bad_request
      end
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

      render json: { status: "ok", message: t('competitions.messages.orga_closed_reg_success') }
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

    render json: { status: "ok" }
  end

  def my_competitions
    if Rails.env.production? && !EnvConfig.WCA_LIVE_SITE?
      registrations_v2 = current_user.microservice_registrations
    else
      registrations_v2 = []
    end

    ActiveRecord::Base.connected_to(role: :read_replica) do
      competition_ids = current_user.organized_competitions.pluck(:competition_id)
      competition_ids.concat(current_user.delegated_competitions.pluck(:competition_id))
      registrations = current_user.registrations.includes(:competition).accepted.reject { |r| r.competition.results_posted? }
      registrations.concat(current_user.registrations.includes(:competition).pending.select { |r| r.competition.upcoming? })
      # TODO: filter like above: accepted only if results not posted, pending only if upcoming
      registrations.concat(registrations_v2)
      @registered_for_by_competition_id = registrations.uniq.to_h do |r|
        [r.competition.id, r]
      end
      competition_ids.concat(@registered_for_by_competition_id.keys)
      if current_user.person
        competition_ids.concat(current_user.person.competitions.pluck(:competitionId))
      end
      # An organiser might still have duties to perform for a cancelled competition until the date of the competition has passed.
      # For example, mailing all competitors about the cancellation.
      # In general ensuring ease of access until it is certain that they won't need to frequently visit the page anymore.
      competitions = Competition.includes(:delegate_report, :delegates)
                                .where(id: competition_ids.uniq).where("cancelled_at is null or end_date >= curdate()")
                                .sort_by { |comp| comp.start_date || (Date.today + 20.year) }.reverse
      @past_competitions, @not_past_competitions = competitions.partition(&:is_probably_over?)
      bookmarked_ids = current_user.competitions_bookmarked.pluck(:competition_id)
      @bookmarked_competitions = Competition.not_over
                                            .where(id: bookmarked_ids.uniq)
                                            .sort_by(&:start_date)
      @show_registration_status = params[:show_registration_status] == "on"
    end
  end

  def for_senior
    user_id = params[:user_id] || current_user.id
    @user = User.find(user_id)
    @competitions = @user.subordinate_delegates.map(&:delegated_competitions).flatten.uniq.reject(&:is_probably_over?).sort_by { |c| c.start_date || (Date.today + 20.year) }.reverse
  end
end
