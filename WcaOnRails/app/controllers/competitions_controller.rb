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
    :disconnect_stripe,
  ]
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }, only: [
    :post_results,
  ]
  before_action -> { redirect_to_root_unless_user(:can_create_competitions?) }, only: [
    :new,
  ]
  before_action -> { redirect_to_root_unless_user(:can_view_senior_delegate_material?) }, only: [
    :for_senior,
  ]
  before_action -> { redirect_to_root_unless_user(:can_manage_competition?, competition_from_params) }, only: [
    :edit,
    :edit_events,
    :edit_schedule,
    :payment_setup,
  ]

  rescue_from WcaExceptions::ApiException do |e|
    render status: e.status, json: { error: e.to_s }
  end

  rescue_from JSON::Schema::ValidationError do |e|
    render status: :bad_request, json: { error: e.to_s }
  end

  private def require_user_permission(action, *args, is_message: false)
    permission_result = current_user&.send(action, *args)

    if is_message && permission_result
      return render status: :forbidden, json: { error: permission_result }
    elsif !permission_result
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
    competition.editing_user_id = current_user.id
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
    nearby_competitions = competition.nearby_competitions_warning.to_a[0, 10]
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
    @competition = Competition.new

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

  def payment_setup
    @competition = competition_from_params(includes: CHECK_SCHEDULE_ASSOCIATIONS)

    client = create_stripe_oauth_client
    oauth_params = {
      scope: 'read_write',
      redirect_uri: EnvConfig.ROOT_URL + competitions_stripe_connect_path,
      state: @competition.id,
    }
    @authorize_url = client.auth_code.authorize_url(oauth_params)
  end

  def stripe_connect
    code = params[:code]
    competition = Competition.find(params[:state])
    unless current_user&.can_manage_competition?(competition)
      raise ActionController::RoutingError.new('Not Found')
    end
    client = create_stripe_oauth_client
    resp = client.auth_code.get_token(code, params: { scope: 'read_write' })
    competition.connected_stripe_account_id = resp.params['stripe_user_id']
    if competition.save
      flash[:success] = t('competitions.messages.stripe_connected')
    else
      flash[:danger] = t('competitions.messages.stripe_not_connected')
    end
    redirect_to competitions_payment_setup_path(competition)
  end

  private def create_stripe_oauth_client
    options = {
      site: 'https://connect.stripe.com',
      authorize_url: '/oauth/authorize',
      token_url: '/oauth/token',
      auth_scheme: :request_body,
    }

    OAuth2::Client.new(AppSecrets.STRIPE_CLIENT_ID, AppSecrets.STRIPE_API_KEY, options)
  end

  def disconnect_stripe
    comp = competition_from_params
    if comp.connected_stripe_account_id
      comp.update!(connected_stripe_account_id: nil)
      flash[:success] = t('competitions.messages.stripe_disconnected_success')
    else
      flash[:danger] = t('competitions.messages.stripe_disconnected_failure')
    end
    redirect_to competitions_payment_setup_path(comp)
  end

  def clone_competition
    competition_to_clone = competition_from_params
    @competition = competition_to_clone.build_clone
    assign_delegate(@competition)
    render :new
  end

  def nearby_competitions
    @competition = Competition.new(competition_params)
    @competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    @competition_admin_view = params.key?(:competition_admin_view) && current_user.can_admin_competitions?
    @nearby_competitions = get_nearby_competitions(@competition)
    render partial: 'nearby_competitions'
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
      distance: link_to_google_maps_dir(
        "#{competition.kilometers_to(other_comp).round(2)} km",
        other_comp.latitude_degrees,
        other_comp.longitude_degrees,
        competition.latitude_degrees,
        competition.longitude_degrees,
      ),
      limit: other_comp.competitor_limit_enabled ? other_comp.competitor_limit : "",
      competitors: other_comp.is_probably_over? ? other_comp.results.select('DISTINCT personId').count : "",
      events: other_comp.events.map { |event|
        event.id
      },
      coordinates: {
        lat: other_comp.latitude_degrees,
        long: other_comp.longitude_degrees,
      },
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

  def series_eligible_competitions
    @competition = Competition.new(competition_params)
    @competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    @series_eligible_competitions = get_series_eligible_competitions(@competition)
    render partial: 'series_eligible_competitions'
  end

  def colliding_registration_start_competitions
    @competition = Competition.new(competition_params)
    @competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    @colliding_registration_start_competitions = get_colliding_registration_start_competitions(@competition)
    render partial: 'colliding_registration_start_competitions'
  end

  def time_until_competition
    @competition = Competition.new(competition_params)
    @competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    render json: {
      has_date_errors: @competition.has_date_errors?,
      html: render_to_string(partial: 'time_until_competition'),
    }
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
      format.html
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
    head :ok
  end

  def unbookmark
    @competition = competition_from_params
    BookmarkedCompetition.where(competition: @competition, user: current_user).each(&:destroy!)
    head :ok
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

      render json: { status: "ok" }
    else
      render status: :bad_request, json: competition.form_errors
    end
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:update]

  def update
    competition = competition_from_params

    competition_admin_view = params.key?(:competition_admin_view) && current_user.can_admin_competitions?
    competition_organizer_view = !competition_admin_view

    old_organizers = competition.organizers.to_a

    # we're quite lax about reading params, because set_form_data! below does a comprehensive JSON-Schema check.
    form_data = params.permit!.to_h

    # Need to delete the ID in this first update pass because it's our primary key (yay legacy code!)
    new_id = form_data.delete(:competitionId)

    competition.set_form_data(form_data, current_user)

    if competition.save
      # Automatically compute the cellName and ID for competitions with a short name.
      if !competition.confirmed? && competition_organizer_view && competition.name.length <= Competition::MAX_CELL_NAME_LENGTH
        old_competition_id = competition.id
        competition.create_id_and_cell_name(force_override: true)

        # Save the newly computed cellName without breaking the ID associations
        # (which in turn is handled by a hack in the next if-block below)
        competition.with_old_id { competition.save! }

        # Try to update the ID only if it _actually_ changed
        new_id = competition.id unless competition.id == old_competition_id
      end

      if new_id && !competition.update(id: new_id)
        # Changing the competition id breaks all our associations, and our view
        # code was not written to handle this. Rather than trying to update our view
        # code, just revert the attempted id change. The user will have to deal with
        # editing the ID text box manually. This will go away once we have proper
        # immutable ids for competitions.
        render status: :bad_request, json: competition.form_errors
      end

      new_organizers = competition.organizers - old_organizers
      removed_organizers = old_organizers - competition.organizers

      new_organizers.each do |new_organizer|
        CompetitionsMailer.notify_organizer_of_addition_to_competition(current_user, competition, new_organizer).deliver_later
      end

      removed_organizers.each do |removed_organizer|
        CompetitionsMailer.notify_organizer_of_removal_from_competition(current_user, competition, removed_organizer).deliver_later
      end

      render json: { status: "ok" }
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

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:announcement_data]

  def confirmation_data
    competition = competition_from_params

    render json: {
      canConfirm: current_user.can_confirm_competition?(competition),
      cannotDeleteReason: current_user.get_cannot_delete_competition_reason(competition),
    }
  end

  before_action -> { require_user_permission(:get_cannot_delete_competition_reason, competition_from_params, is_message: false) }, only: [:destroy]

  def destroy
    competition = competition_from_params
    competition.destroy

    render json: { status: "ok" }
  end

  before_action -> { require_user_permission(:can_confirm_competition?, competition_from_params) }, only: [:confirm]

  def confirm
    competition = competition_from_params

    competition.update!(confirmed: true)

    CompetitionsMailer.notify_wcat_of_confirmed_competition(current_user, competition).deliver_later

    competition.organizers.each do |organizer|
      CompetitionsMailer.notify_organizer_of_confirmed_competition(current_user, competition, organizer).deliver_later
    end

    render json: { status: "ok" }
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

    render json: { status: "ok" }
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
        render json: { error: t('competitions.messages.uncancel_failure') }
      end
    else
      if competition.can_be_cancelled?
        competition.update!(cancelled_at: Time.now, cancelled_by: current_user.id)
        render json: { status: "ok", message: t('competitions.messages.cancel_success') }
      else
        render json: { error: t('competitions.messages.cancel_failure') }
      end
    end
  end

  before_action -> { require_user_permission(:can_manage_competition?, competition_from_params) }, only: [:close_full_registration]

  def close_full_registration
    competition = competition_from_params

    if competition.orga_can_close_reg_full_limit?
      competition.update!(registration_close: Time.now)
      render json: { status: "ok", message: t('competitions.messages.orga_closed_reg_success') }
    else
      render json: { error: t('competitions.messages.orga_closed_reg_failure') }
    end
  end

  def my_competitions
    ActiveRecord::Base.connected_to(role: :read_replica) do
      competition_ids = current_user.organized_competitions.pluck(:competition_id)
      competition_ids.concat(current_user.delegated_competitions.pluck(:competition_id))
      registrations = current_user.registrations.includes(:competition).accepted.reject { |r| r.competition.results_posted? }
      registrations.concat(current_user.registrations.includes(:competition).pending.select { |r| r.competition.upcoming? })
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
    @user = User.includes(subordinate_delegates: { delegated_competitions: [:delegates, :delegate_report] }).find_by_id(params[:user_id] || current_user.id)
    @competitions = @user.subordinate_delegates.map(&:delegated_competitions).flatten.uniq.reject(&:is_probably_over?).sort_by { |c| c.start_date || (Date.today + 20.year) }.reverse
  end

  private def competition_params
    permitted_competition_params = [
      :receive_registration_emails,
      :being_cloned_from_id,
      :clone_tabs,
    ]

    if @competition.nil? || @competition.can_edit_registration_fees?
      permitted_competition_params += [
        :base_entry_fee_lowest_denomination,
        :currency_code,
      ]
    end

    if @competition&.confirmed? && !current_user.can_admin_competitions?
      # If the competition is confirmed, non admins are not allowed to change anything.
    else
      permitted_competition_params += [
        :id,
        :name,
        :name_reason,
        :cellName,
        :countryId,
        :cityName,
        :venue,
        :venueAddress,
        :latitude_degrees,
        :longitude_degrees,
        :venueDetails,
        :start_date,
        :end_date,
        :information,
        :staff_delegate_ids,
        :trainee_delegate_ids,
        :organizer_ids,
        :contact,
        :generate_website,
        :external_website,
        :use_wca_registration,
        :external_registration_page,
        :use_wca_live_for_scoretaking,
        :enable_donations,
        :guests_enabled,
        :guests_per_registration_limit,
        :events_per_registration_limit,
        :registration_open,
        :registration_close,
        :competitor_limit_enabled,
        :competitor_limit,
        :competitor_limit_reason,
        :remarks,
        :force_comment_in_registration,
        :extra_registration_requirements,
        :on_the_spot_registration,
        :on_the_spot_entry_fee_lowest_denomination,
        :allow_registration_without_qualification,
        :allow_registration_edits,
        :allow_registration_self_delete_after_acceptance,
        :refund_policy_percent,
        :refund_policy_limit_date,
        :early_puzzle_submission,
        :early_puzzle_submission_reason,
        :qualification_results,
        :qualification_results_reason,
        :event_restrictions,
        :event_restrictions_reason,
        :guests_entry_fee_lowest_denomination,
        :guest_entry_status,
        :main_event_id,
        :waiting_list_deadline_date,
        :event_change_deadline_date,
        { competition_events_attributes: [:id, :event_id, :_destroy],
          championships_attributes: [:id, :championship_type, :_destroy],
          competition_series_attributes: [:id, :wcif_id, :name, :short_name, :competition_ids, :_destroy] },
      ]
      if current_user.can_admin_competitions?
        permitted_competition_params += [
          :confirmed,
          :showAtAll,
        ]
      end
    end

    params.require(:competition).permit(*permitted_competition_params).tap do |competition_params|
      competition_params[:editing_user_id] = current_user.id

      # Quirk: When adding a new competition to an already existing (i.e. already persisted) Series,
      # Rails will throw an error like "cannot find Series with ID 123 for NewCompetition"
      # despite we're sending the update to change Series 123 to include NewCompetition.
      # To mitigate this error, we must deliberately write to series_id first.
      if (persisted_series_id = competition_params.try(:[], :competition_series_attributes)&.try(:[], :id))
        competition_params[:competition_series_id] = persisted_series_id
      end

      # Quirk: We don't want to actually destroy CompetitionSeries directly,
      # because that could badly affect other competitions that are still attached to that series.
      # If the frontend sends a _destroy, we only unlink the *current* competition and let validations take care of the rest.
      if (series_destroy_flag = competition_params.try(:[], :competition_series_attributes)&.try(:[], :_destroy))
        # Yes, this is ugly but it's the way simple_form_for does things.
        should_delete = ActiveModel::Type::Boolean.new.cast(series_destroy_flag)

        if should_delete
          competition_params[:competition_series_id] = nil
          competition_params.delete :competition_series_attributes
        end
      end
    end
  end
end
