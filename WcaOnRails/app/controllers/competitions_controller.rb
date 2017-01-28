# frozen_string_literal: true
class CompetitionsController < ApplicationController
  include ApplicationHelper

  PAST_COMPETITIONS_DAYS = 90
  before_action :authenticate_user!, except: [
    :index,
    :show,
    :show_podiums,
    :show_all_results,
    :show_results_by_person,
  ]
  before_action -> { redirect_unless_user(:can_admin_results?) }, only: [
    :post_announcement,
    :post_results,
    :admin_edit,
  ]

  private def competition_from_params
    competition = Competition.find(params[:competition_id] || params[:id])
    if !competition.user_can_view?(current_user)
      raise ActionController::RoutingError.new('Not Found')
    end
    competition
  end

  before_action -> { redirect_unless_user(:can_manage_competition?, competition_from_params) }, only: [:edit, :update, :edit_events, :update_events]

  before_action -> { redirect_unless_user(:can_create_competitions?) }, only: [:new, :create]

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
    unless %w(past present recent).include? params[:state]
      params[:state] = "present"
    end
    params[:year] ||= "all years"
    params[:status] ||= "all"
    @display = %w(list map admin).include?(params[:display]) ? params[:display] : "list"

    # Facebook adds indices to the params automatically when redirecting.
    # See: https://github.com/thewca/worldcubeassociation.org/issues/472
    if params[:event_ids].is_a?(Hash)
      params[:event_ids] = params[:event_ids].values
    end

    @past_selected = params[:state] == "past"
    @present_selected = params[:state] == "present"
    @recent_selected = params[:state] == "recent"

    @years = ["all years"] + Competition.where(showAtAll: true).pluck(:year).uniq.select { |y| y <= Date.today.year }.sort!.reverse!

    if params[:delegate].present?
      delegate = User.find(params[:delegate])
      @competitions = delegate.delegated_competitions
    else
      @competitions = Competition
    end
    @competitions = @competitions.includes(:country).where(showAtAll: true).order(:year, :month, :day)

    if @present_selected
      @competitions = @competitions.not_over
    elsif @recent_selected
      @competitions = @competitions.where("CAST(CONCAT(endYear,'-',endMonth,'-',endDay) as Datetime) between ? and ?", (Date.today - Competition::RECENT_DAYS), Date.today).reverse_order
    else
      @competitions = @competitions.where("CAST(CONCAT(endYear,'-',endMonth,'-',endDay) as Datetime) < ?", Date.today).reverse_order
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
      redirect_to edit_competition_path(@competition)
    else
      # Show id errors under name, since we don't actually show an
      # id field to the user, so they wouldn't see any id errors.
      @competition.errors[:name].concat(@competition.errors[:id])
      @nearby_competitions = get_nearby_competitions(@competition)
      render :new
    end
  end

  private def create_post_and_redirect(post_attrs)
    @post = Post.new(post_attrs)
    if @post.save
      flash[:success] = "Created new post"
      redirect_to post_path(@post.slug)
    else
      render 'posts/new'
    end
  end

  def post_announcement
    comp = Competition.find(params[:id])
    date_range_str = wca_date_range(comp.start_date, comp.end_date, format: :long, locale: :en)
    title = "#{comp.name} on #{date_range_str} in #{comp.cityName}, #{comp.countryId}"

    body = "The [#{comp.name}](#{competition_url(comp)})"
    body += " will take place on #{date_range_str} in #{comp.cityName}, #{comp.countryId}."
    unless comp.website.blank?
      body += " Check out the [#{comp.name} website](#{comp.website}) for more information and registration.";
    end
    create_post_and_redirect(title: title, body: body, author: current_user, world_readable: true)

    comp.update!(announced_at: Time.now)
  end

  def post_results
    comp = Competition.find(params[:id])
    unless comp.results
      render html: "<div class='container'><div class='alert alert-warning'>No results</div></div>".html_safe
      return
    end

    top333 = comp.results.where(eventId: '333', roundId: ['f', 'c']).order(:pos).limit(3)
    if top333.empty? # If there was no 3x3x3 event.
      title = "Results of #{comp.name}, in #{comp.cityName}, #{comp.countryId} posted"
      body = "Results of the [#{comp.name}](#{competition_url(comp)}) are now available.\n\n"
    elsif top333.length < 3
      render html: "<div class='container'><div class='alert alert-danger'>Too few people competed in 333</div></div>".html_safe
      return
    else
      title = "#{top333.first.personName} wins #{comp.name}, in #{comp.cityName}, #{comp.countryId}"

      body = "[#{top333.first.personName}](https://www.worldcubeassociation.org/results/p.php?i=#{top333.first.personId})"
      body += " won the [#{comp.name}](#{competition_url(comp)})"
      body += " with an average of #{top333.first.to_s :average} seconds."

      body += " [#{top333.second.personName}](https://www.worldcubeassociation.org/results/p.php?i=#{top333.second.personId}) finished second (#{top333.second.to_s :average})"

      body += " and [#{top333.third.personName}](https://www.worldcubeassociation.org/results/p.php?i=#{top333.third.personId}) finished third (#{top333.third.to_s :average}).\n\n"
    end

    [
      { code: "WR",  name: "World" },
      { code: "AfR", name: "African" },
      { code: "AsR", name: "Asian" },
      { code: "OcR", name: "Oceanian" },
      { code: "ER",  name: "European" },
      { code: "NAR", name: "North American" },
      { code: "SAR", name: "South American" },
    ].each do |code_name|
      code = code_name[:code]
      region_name = code_name[:name]
      comp_records = comp.results.where('regionalSingleRecord=:code OR regionalAverageRecord=:code', { code: code })
      unless comp_records.empty?
        body += "#{region_name} records: "
        record_strs = comp_records.group_by(&:personName).sort.map do |personName, results|
          results_by_personId = results.group_by(&:personId).sort
          results_by_personId.map do |personId, results|
            if results_by_personId.length > 1
              # Two or more people with the same name set records at this competition!
              # Append their WCA IDs to distinguish between them.
              uniqueName = "#{personName} (#{personId})"
            else
              uniqueName = personName
            end
            record_strs = results.sort_by do |r|
              round = Round.c_find(r.roundId)
              [Event.c_find(r.eventId).rank, round.rank]
            end.map do |result|
              event = Event.c_find(result.eventId)
              record_strs = []
              if result.regionalSingleRecord == code
                record_strs << "#{event.name_in(:en)} #{result.to_s :best} (single)"
              end
              if result.regionalAverageRecord == code
                record_strs << "#{event.name_in(:en)} #{result.to_s :average} (average)"
              end
              record_strs
            end.flatten
            "#{uniqueName} #{record_strs.join(", ")}"
          end
        end
        body += "#{record_strs.join(", ")}.  \n" # Trailing spaces for markdown give us a <br>
      end
    end
    comp.update!(results_posted_at: Time.now)
    comp.competitor_users.each { |user| user.notify_of_results_posted(comp) }
    comp.registrations.accepted.each { |registration| registration.user.notify_of_id_claim_possibility(comp) }
    create_post_and_redirect(title: title, body: body, author: current_user, world_readable: true)
  end

  def edit_events
    @competition = Competition.find(params[:id])
  end

  def update_events
    @competition = Competition.find(params[:id])
    if @competition.update_attributes(competition_params)
      flash[:success] = t('.update_success')
      redirect_to edit_events_path(@competition)
    else
      render :edit_events
    end
  end

  def get_nearby_competitions(competition)
    nearby_competitions = competition.nearby_competitions(Competition::NEARBY_DAYS_WARNING, Competition::NEARBY_DISTANCE_KM_WARNING)[0, 10]
    nearby_competitions.select!(&:isConfirmed?) unless current_user.can_view_hidden_competitions?
    nearby_competitions
  end

  def admin_edit
    @competition = Competition.find(params[:id])
    @competition_admin_view = true
    @competition_organizer_view = false
    @nearby_competitions = get_nearby_competitions(@competition)
    render :edit
  end

  def edit
    @competition = Competition.find(params[:id])
    @competition_admin_view = false
    @competition_organizer_view = true
    @nearby_competitions = get_nearby_competitions(@competition)
    render :edit
  end

  def clone_competition
    competition_to_clone = Competition.find(params[:id])
    @competition = competition_to_clone.build_clone
    if current_user.any_kind_of_delegate?
      @competition.delegates |= [current_user]
    end
    render :new
  end

  def nearby_competitions
    @competition = Competition.new(competition_params)
    @competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    @competition_admin_view = params.key?(:competition_admin_view) && current_user.can_admin_results?
    @nearby_competitions = get_nearby_competitions(@competition)
    render partial: 'nearby_competitions'
  end

  def time_until_competition
    @competition = Competition.new(competition_params)
    @competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    @competition_admin_view = params.key?(:competition_admin_view) && current_user.can_admin_results?
    render json: {
      has_date_errors: @competition.has_date_errors?,
      html: render_to_string(partial: 'time_until_competition'),
    }
  end

  def show
    @competition = competition_from_params
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

  def update
    @competition = Competition.find(params[:id])
    @competition_admin_view = params.key?(:competition_admin_view) && current_user.can_admin_results?
    @competition_organizer_view = !@competition_admin_view

    comp_params_minus_id = competition_params
    new_id = comp_params_minus_id.delete(:id)
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

      if params[:commit] == "Confirm"
        CompetitionsMailer.notify_board_of_confirmed_competition(current_user, @competition).deliver_later
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
    competitions = (current_user.delegated_competitions + current_user.organized_competitions + current_user.competitions_registered_for)
    if current_user.person
      competitions += current_user.person.competitions
    end
    competitions = competitions.uniq.sort_by { |comp| comp.start_date || Date.today + 20.year }.reverse
    @past_competitions, @not_past_competitions = competitions.partition(&:is_over?)
  end

  private def competition_params
    permitted_competition_params = [
      :use_wca_registration,
      :receive_registration_emails,
      :registration_open,
      :registration_close,
      :guests_enabled,
      :being_cloned_from_id,
      :clone_tabs,
      :base_entry_fee_lowest_denomination,
      :currency_code,
    ]
    if @competition && @competition.isConfirmed? && !current_user.can_admin_results?
      # If the competition is confirmed, non admins are not allowed to change anything.
    else
      permitted_competition_params += [
        :id,
        :name,
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
        :remarks,
        competition_events_attributes: [:id, :event_id, :_destroy],
      ]
      if current_user.can_admin_results?
        permitted_competition_params += [
          :isConfirmed,
          :showAtAll,
        ]
      end
    end

    competition_params = params.require(:competition).permit(*permitted_competition_params)
    if params[:commit] == "Confirm" && current_user.can_confirm_competition?(@competition)
      competition_params[:isConfirmed] = true
    end
    competition_params[:editing_user_id] = current_user.id
    competition_params
  end
end
