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

  before_action -> { redirect_unless_user(:can_manage_competition?, competition_from_params) }, only: [:edit, :update]

  before_action -> { redirect_unless_user(:can_create_competitions?) }, only: [:new, :create]

  def new
    @competition = Competition.new
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
    params[:state] ||= "present"
    params[:year] ||= "all years"
    params[:display] ||= "list"

    # Facebook adds indices to the params automatically when redirecting.
    # See: https://github.com/cubing/worldcubeassociation.org/issues/472
    if params[:event_ids].is_a?(Hash)
      params[:event_ids] = params[:event_ids].values
    end

    @past_selected = params[:state] == "past"
    @present_selected = !@past_selected

    @regions = { 'Continent' => Continent.all.map { |continent| [continent.name, continent.id] },
                 'Country' => Country.all.map { |country| [country.name, country.id] } }
    @years = ["all years"] + Competition.where(showAtAll: true).pluck(:year).uniq.select { |y| y <= Date.today.year }.sort!.reverse!
    @competitions = Competition.where(showAtAll: true).order(:year, :month, :day)

    if @present_selected
      @competitions = @competitions.where("CAST(CONCAT(year,'-',endMonth,'-',endDay) as Datetime) >= ?", Date.today)
    else
      @competitions = @competitions.where("CAST(CONCAT(year,'-',endMonth,'-',endDay) as Datetime) < ?", Date.today).reverse_order
      unless params[:year] == "all years"
        @competitions = @competitions.where(year: params[:year])
      end
    end

    unless params[:region] == "all"
      @competitions = @competitions.select { |competition| competition.belongs_to_region?(params[:region]) }
    end

    if params[:search].present?
      @competitions = @competitions.select { |competition| competition.contains?(params[:search]) }
    end

    unless params[:event_ids].empty?
      @competitions = @competitions.select { |competition| competition.has_events_with_ids?(params[:event_ids]) }
    end

    respond_to do |format|
      format.html {}
      format.js do
        # We change the browser's history when replacing url after an Ajax request.
        # So we must prevent a browser from caching the JavaScript response.
        # It's necessary because if the browser caches the response, the user will see a JavaScript response
        # when he clicks browser back/forward buttons.
        response.headers["Cache-Control"] = "no-cache, no-store"
        render 'index', locals: { current_url: request.original_url }
      end
    end
  end

  def create
    new_competition_params = params.require(:competition).permit(:name, :competition_id_to_clone)
    @competition = Competition.new(new_competition_params.merge(
                                   registration_open: 1.week.from_now,
                                   registration_close: 2.weeks.from_now))
    if current_user.any_kind_of_delegate?
      @competition.delegates |= [current_user]
    end

    if @competition.save
      if @competition.competition_id_to_clone.present?
        flash[:success] = "Successfully cloned #{@competition.competition_id_to_clone}!"
      else
        flash[:success] = "Successfully created new competition!"
      end
      redirect_to edit_competition_path(@competition)
    else
      # Show id errors under name, since we don't actually show an
      # id field to the user, so they wouldn't see any id errors.
      @competition.errors[:name].concat(@competition.errors[:id])
      render :new
    end
  end

  private def post_post(post)
    @post = post
    if @post.save
      flash[:success] = "Created new post"
      redirect_to post_path(@post.slug)
    else
      render 'posts/new'
    end
  end

  def post_announcement
    comp = Competition.find(params[:id])
    if comp.start_date.nil? || comp.end_date.nil?
      date_range_str = "unscheduled"
    else
      date_range_str = wca_date_range(comp.start_date, comp.end_date, format: :long)
    end
    title = "#{comp.name} on #{date_range_str} in #{comp.cityName}, #{comp.countryId}"

    body = "The [#{comp.name}](#{competition_url(comp)})"
    body += " will take place on #{date_range_str} in #{comp.cityName}, #{comp.countryId}."
    unless comp.website.blank?
      body += " Check out the [#{comp.name} website](#{comp.website}) for more information and registration.";
    end
    @post = Post.new(title: title, body: body, author: current_user, world_readable: true)
    post_post(@post)
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
      body += " won the the [#{comp.name}](#{competition_url(comp)})"
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
              round = Round.find(r.roundId)
              [Event.find(r.eventId).rank, round.rank]
            end.map do |result|
              event = Event.find(result.eventId)
              record_strs = []
              if result.regionalSingleRecord == code
                record_strs << "#{event.cellName} #{result.to_s :best} (single)"
              end
              if result.regionalAverageRecord == code
                record_strs << "#{event.cellName} #{result.to_s :average} (average)"
              end
              record_strs
            end.flatten
            "#{uniqueName} #{record_strs.join(", ")}"
          end
        end
        body += "#{record_strs.join(", ")}.  \n" # Trailing spaces for markdown give us a <br>
      end
    end
    post = Post.new(title: title, body: body, author: current_user, world_readable: true)
    post_post(post)
    comp.results_posted_at = Time.now
    comp.save!
  end

  def admin_edit
    @competition = Competition.find(params[:id])
    @competition_admin_view = true
    @competition_organizer_view = false
    render :edit
  end

  def edit
    @competition = Competition.find(params[:id])
    @competition_admin_view = false
    @competition_organizer_view = true
    render :edit
  end

  def nearby_competitions
    @competition = Competition.find(params[:id])
    @competition.assign_attributes(competition_params)
    @competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    @competition_admin_view = params.key?(:competition_admin_view) && current_user.can_admin_results?
    render partial: 'nearby_competitions'
  end

  def time_until_competition
    @competition = Competition.find(params[:id])
    @competition.assign_attributes(competition_params)
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
    if params[:commit] == "Delete"
      cannot_delete_competition_reason = current_user.get_cannot_delete_competition_reason(@competition)
      if cannot_delete_competition_reason
        flash.now[:danger] = cannot_delete_competition_reason
        render :edit
      else
        @competition.destroy
        flash[:success] = "Successfully deleted competition #{@competition.id}"
        redirect_to root_url
      end
    elsif @competition.update_attributes(competition_params)
      if params[:commit] == "Confirm"
        CompetitionsMailer.notify_board_of_confirmed_competition(current_user, @competition).deliver_now
        flash[:success] = "Successfully confirmed competition. Check your email, and wait for the Board to announce it!"
      else
        flash[:success] = "Successfully saved competition"
      end
      if @competition_admin_view
        redirect_to admin_edit_competition_path(@competition)
      else
        redirect_to edit_competition_path(@competition)
      end
    else
      render :edit
    end
  end

  def my_competitions
    @competitions = (current_user.delegated_competitions + current_user.organized_competitions + current_user.competitions_registered_for)
    if current_user.person
      @competitions += current_user.person.competitions
    end
    @competitions = @competitions.uniq.sort_by(&:start_date).reverse!
    @not_past_competitions = @competitions.reject(&:is_over?)
    @past_competitions = @competitions.select(&:is_over?)
  end

  private def competition_params
    permitted_competition_params = [
      :use_wca_registration,
      :receive_registration_emails,
      :registration_open,
      :registration_close,
      :guests_enabled,
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
        :website,
        :remarks,
        event_ids: Event.all.map { |event| event.id.to_sym },
      ]
      if current_user.can_admin_results?
        permitted_competition_params += [
          :isConfirmed,
          :showAtAll,
        ]
      end
    end

    competition_params = params.require(:competition).permit(*permitted_competition_params)
    if competition_params.key?(:event_ids)
      competition_params[:eventSpecs] = competition_params[:event_ids].select { |k, v| v == "1" }.keys.join " "
      competition_params.delete(:event_ids)
    end
    if params[:commit] == "Confirm" && current_user.can_confirm_competition?(@competition)
      competition_params[:isConfirmed] = true
    end
    competition_params[:editing_user_id] = current_user.id
    competition_params
  end
end
