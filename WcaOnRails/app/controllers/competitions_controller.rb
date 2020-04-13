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
    :show_events,
  ]
  before_action -> { redirect_to_root_unless_user(:can_admin_competitions?) }, only: [
    :post_announcement,
    :admin_edit,
  ]
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }, only: [
    :post_results,
  ]

  private def competition_from_params(includes: nil)
    Competition.includes(includes).find(params[:competition_id] || params[:id]).tap do |competition|
      unless competition.user_can_view?(current_user)
        raise ActionController::RoutingError.new('Not Found')
      end
    end
  end

  before_action -> { redirect_to_root_unless_user(:can_manage_competition?, competition_from_params) }, only: [:edit, :update, :edit_events, :edit_schedule, :payment_setup]

  before_action -> { redirect_to_root_unless_user(:can_create_competitions?) }, only: [:new, :create]

  before_action -> { redirect_to_root_unless_user(:can_view_senior_delegate_material?) }, only: [:for_senior]

  def new
    @competition = Competition.new
    if current_user.any_kind_of_delegate?
      @competition.delegates = [current_user]
    end
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

    @years = ["all years"] + Competition.non_future_years

    if params[:delegate].present?
      delegate = User.find(params[:delegate])
      @competitions = delegate.delegated_competitions
    else
      @competitions = Competition
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
        @competitions = @competitions.where(year: params[:year])
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

  def create
    @competition = Competition.new(competition_params)

    if @competition.save
      flash[:success] = t('competitions.messages.create_success')
      @competition.organizers.each do |organizer|
        CompetitionsMailer.notify_organizer_of_addition_to_competition(current_user, @competition, organizer).deliver_later
      end
      redirect_to edit_competition_path(@competition)
    else
      # Show id errors under name, since we don't actually show an
      # id field to the user, so they wouldn't see any id errors.
      @competition.errors[:name].concat(@competition.errors[:id])
      @nearby_competitions = get_nearby_competitions(@competition)
      render :new
    end
  end

  def post_announcement
    comp = competition_from_params
    unless comp.announced?
      ActiveRecord::Base.transaction do
        comp.update!(announced_at: Time.now, announced_by: current_user.id)
        comp.organizers.each do |organizer|
          CompetitionsMailer.notify_organizer_of_announced_competition(comp, organizer).deliver_later
        end
      end
    end

    flash[:success] = t('competitions.messages.announced')
    redirect_to admin_edit_competition_path(comp)
  end

  def post_results
    comp = competition_from_params
    if ComputeAuxiliaryData.in_progress?
      flash[:danger] = t('competitions.messages.computing_auxiliary_data')
      return redirect_to admin_edit_competition_path(comp)
    end

    unless comp.results.any?
      flash[:danger] = t('competitions.messages.no_results')
      return redirect_to admin_edit_competition_path(comp)
    end

    if comp.main_event && comp.results.where(eventId: comp.main_event_id).empty?
      flash[:danger] = t('competitions.messages.no_main_event_results', event_name: comp.main_event.name)
      return redirect_to admin_edit_competition_path(comp)
    end

    if comp.results_posted?
      flash[:danger] = t('competitions.messages.results_already_posted')
      return redirect_to admin_edit_competition_path(comp)
    end

    ActiveRecord::Base.transaction do
      comp.update!(results_posted_at: Time.now, results_posted_by: current_user.id)
      comp.competitor_users.each { |user| user.notify_of_results_posted(comp) }
      comp.registrations.accepted.each { |registration| registration.user.maybe_assign_wca_id_by_results(comp) }
    end

    flash[:success] = t('competitions.messages.results_posted')
    redirect_to admin_edit_competition_path(comp)
  end

  def show_events
    @competition = competition_from_params(includes: [:events, competition_events: { rounds: [:format, :competition_event] }])
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
    nearby_competitions = competition.nearby_competitions(Competition::NEARBY_DAYS_WARNING, Competition::NEARBY_DISTANCE_KM_WARNING)[0, 10]
    nearby_competitions.select!(&:confirmed?) unless current_user.can_view_hidden_competitions?
    nearby_competitions
  end

  def admin_edit
    @competition = competition_from_params(includes: CHECK_SCHEDULE_ASSOCIATIONS)
    @competition_admin_view = true
    @competition_organizer_view = false
    @nearby_competitions = get_nearby_competitions(@competition)
    render :edit
  end

  def edit
    @competition = competition_from_params(includes: CHECK_SCHEDULE_ASSOCIATIONS)
    @competition_admin_view = false
    @competition_organizer_view = true
    @nearby_competitions = get_nearby_competitions(@competition)
    render :edit
  end

  def payment_setup
    @competition = competition_from_params(includes: CHECK_SCHEDULE_ASSOCIATIONS)

    client = create_stripe_oauth_client
    oauth_params = {
      scope: 'read_write',
      redirect_uri: ENVied.ROOT_URL + competitions_stripe_connect_path,
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
    }

    OAuth2::Client.new(ENVied.STRIPE_CLIENT_ID, ENVied.STRIPE_API_KEY, options)
  end

  def clone_competition
    competition_to_clone = competition_from_params
    @competition = competition_to_clone.build_clone
    if current_user.any_kind_of_delegate?
      @competition.delegates |= [current_user]
    end
    render :new
  end

  def nearby_competitions
    @competition = Competition.new(competition_params)
    @competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    @competition_admin_view = params.key?(:competition_admin_view) && current_user.can_admin_competitions?
    @nearby_competitions = get_nearby_competitions(@competition)
    render partial: 'nearby_competitions'
  end

  def time_until_competition
    @competition = Competition.new(competition_params)
    @competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    @competition_admin_view = params.key?(:competition_admin_view) && current_user.can_admin_competitions?
    render json: {
      has_date_errors: @competition.has_date_errors?,
      html: render_to_string(partial: 'time_until_competition'),
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

  def update
    @competition = competition_from_params(includes: CHECK_SCHEDULE_ASSOCIATIONS)
    @competition_admin_view = params.key?(:competition_admin_view) && current_user.can_admin_competitions?
    @competition_organizer_view = !@competition_admin_view

    comp_params_minus_id = competition_params
    new_id = comp_params_minus_id.delete(:id)

    old_organizers = @competition.organizers.to_a

    if params[:commit] == "Delete"
      cannot_delete_competition_reason = current_user.get_cannot_delete_competition_reason(@competition)
      if cannot_delete_competition_reason
        flash.now[:danger] = cannot_delete_competition_reason
        render :edit
      else
        @competition.destroy
        flash[:success] = t('.delete_success', id: @competition.id)
        redirect_to root_url
      end
    elsif @competition.update_attributes(comp_params_minus_id)
      if new_id && !@competition.update_attributes(id: new_id)
        # Changing the competition id breaks all our associations, and our view
        # code was not written to handle this. Rather than trying to update our view
        # code, just revert the attempted id change. The user will have to deal with
        # editing the ID text box manually. This will go away once we have proper
        # immutable ids for competitions.
        @competition = Competition.find(params[:id])
      end

      new_organizers = @competition.organizers - old_organizers
      removed_organizers = old_organizers - @competition.organizers

      new_organizers.each do |new_organizer|
        CompetitionsMailer.notify_organizer_of_addition_to_competition(current_user, @competition, new_organizer).deliver_later
      end

      removed_organizers.each do |removed_organizer|
        CompetitionsMailer.notify_organizer_of_removal_from_competition(current_user, @competition, removed_organizer).deliver_later
      end

      if params[:commit] == "Confirm"
        CompetitionsMailer.notify_wcat_of_confirmed_competition(current_user, @competition).deliver_later
        @competition.organizers.each do |organizer|
          CompetitionsMailer.notify_organizer_of_confirmed_competition(current_user, @competition, organizer).deliver_later
        end
        flash[:success] = t('.confirm_success')
      else
        flash[:success] = t('.save_success')
      end
      if @competition_admin_view
        redirect_to admin_edit_competition_path(@competition)
      else
        redirect_to edit_competition_path(@competition)
      end
    else
      @nearby_competitions = get_nearby_competitions(@competition)
      render :edit
    end
  end

  def my_competitions
    competition_ids = current_user.organized_competitions.pluck(:competition_id)
    competition_ids.concat(current_user.delegated_competitions.pluck(:competition_id))
    registrations = current_user.registrations.includes(:competition).accepted.reject { |r| r.competition.results_posted? }
    registrations.concat(current_user.registrations.includes(:competition).pending.select { |r| r.competition.upcoming? })
    @registered_for_by_competition_id = Hash[registrations.uniq.map do |r|
      [r.competition.id, r]
    end]
    competition_ids.concat(@registered_for_by_competition_id.keys)
    if current_user.person
      competition_ids.concat(current_user.person.competitions.pluck(:competitionId))
    end
    competitions = Competition.includes(:delegate_report, :delegates)
                              .where(id: competition_ids.uniq)
                              .sort_by { |comp| comp.start_date || Date.today + 20.year }.reverse
    @past_competitions, @not_past_competitions = competitions.partition(&:is_probably_over?)
    bookmarked_ids = current_user.competitions_bookmarked.pluck(:competition_id)
    @bookmarked_competitions = Competition.not_over
                                          .where(id: bookmarked_ids.uniq)
                                          .sort_by(&:start_date)
  end

  def for_senior
    @user = User.includes(subordinate_delegates: { delegated_competitions: [:delegates, :delegate_report] }).find_by_id(params[:user_id] || current_user.id)
    @competitions = @user.subordinate_delegates.map(&:delegated_competitions).flatten.uniq.reject(&:is_probably_over?).sort_by { |c| c.start_date || Date.today + 20.year }.reverse
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
        :delegate_ids,
        :organizer_ids,
        :contact,
        :generate_website,
        :external_website,
        :use_wca_registration,
        :external_registration_page,
        :enable_donations,
        :guests_enabled,
        :registration_open,
        :registration_close,
        :competitor_limit_enabled,
        :competitor_limit,
        :competitor_limit_reason,
        :remarks,
        :extra_registration_requirements,
        :on_the_spot_registration,
        :on_the_spot_entry_fee_lowest_denomination,
        :refund_policy_percent,
        :refund_policy_limit_date,
        :early_puzzle_submission,
        :early_puzzle_submission_reason,
        :qualification_results,
        :qualification_results_reason,
        :event_restrictions,
        :event_restrictions_reason,
        :guests_entry_fee_lowest_denomination,
        :main_event_id,
        competition_events_attributes: [:id, :event_id, :_destroy],
        championships_attributes: [:id, :championship_type, :_destroy],
      ]
      if current_user.can_admin_competitions?
        permitted_competition_params += [
          :confirmed,
          :showAtAll,
        ]
      end
    end

    params.require(:competition).permit(*permitted_competition_params).tap do |competition_params|
      if params[:commit] == "Confirm" && current_user.can_confirm_competition?(@competition)
        competition_params[:confirmed] = true
      end
      competition_params[:editing_user_id] = current_user.id
    end
  end
end
