class CompetitionsController < ApplicationController
  before_action :authenticate_user!, except: [:show, :index]
  before_action :can_admin_results_only, only: [:post_announcement, :post_results, :admin_edit]

  private def competition_from_params
    competition = Competition.find(params[:id])
    if !competition.user_can_view?(current_user)
      raise ActionController::RoutingError.new('Not Found')
    end
    competition
  end

  before_action :can_manage_competition_only, only: [:edit, :update]
  private def can_manage_competition_only
    competition = competition_from_params
    unless current_user && current_user.can_manage_competition?(competition)
      flash[:danger] = "You are not allowed to manage this competition"
      redirect_to root_url
    end
  end

  before_action :can_create_competition_only, only: [:new, :create]
  private def can_create_competition_only
    unless current_user && current_user.can_create_competition?
      flash[:danger] = "You are not allowed to create competitions"
      redirect_to root_url
    end
  end

  def new
    @competition = Competition.new
  end

  def index
    query = "CAST(CONCAT(year,'-',month,'-',day) as Datetime) > ? and showAtAll = true"
    query_params = [(Date.today - 90)]

    @regions = [ ["All","all"],["",""],["Africa","_Africa"],["Asia","_Asia"],["Europe","_Europe"],["North America","_North America"],["Oceania","_Oceania"],["South America","_South America"],["",""] ] + Country.all.map { |country| [country.name, country.id] }
    @events = [ ["All", "all"], ["",""] ] + Event.all_official.map { |event| [event.name, event.id] }
    @years = [ ["Current","current"],["All","all"],["",""] ] + Competition.select(:year).map(&:year).uniq.reverse!
    @competitions = Competition.where(showAtAll: true).order(:year, :month, :day).reverse_order

    # This need to be the first thing, otherwise @competitions will be an array instead of an object
    # and the .where will not work
    if params[:years]
      if params[:years] == "current"
        @competitions = @competitions.where(query, query_params)
      elsif params[:years] != "all"
        @competitions = @competitions.reject { |competition| competition.year.to_s != params[:years] }
      end
    else
      @competitions = @competitions.where(query, query_params)
    end

    if params[:event] && params[:event] != "all"
      @competitions = @competitions.reject { |competition| !competition.has_event?(Event.find(params[:event])) }
    end

    if params[:region] && params[:region] != "all"
      @competitions = @competitions.reject { |competition| !competition.belongs_to_region?(params[:region]) }
    end

    if params[:search]
      @competitions = @competitions.reject { |competition| !competition.search(params[:search]) }
    end

    if !params[:commit]
      params[:commit] = "List"
    end

    # A little explanation here: we search for the closest one, but it may be before or after today.
    # If the competitions list is all in the past, we won't show the "today" line, because
    # @closest_index will be 0 here, and no index will match -1 in the view.
    # If we have both past and future competitions, we need to find out where to put the "today" line.
    # For competitions in the future, we move the @closest_index up by one, to correctly position
    # the "today" line.
    closest_competition = @competitions.sort_by { |competition| (competition.start_date - Date.today).abs }.first
    if closest_competition.start_date < Date.today
      @closest_index = @competitions.index(closest_competition)
    else
      @closest_index = @competitions.index(closest_competition) + 1
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
      date_range_str = date_range(comp.start_date, comp.end_date)
    end
    title = "#{comp.name} on #{date_range_str} in #{comp.cityName}, #{comp.countryId}"

    body = "The [#{comp.name}](#{root_url}results/c.php?i=#{comp.id})"
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
      title = "Results of #{comp.name} posted"
      body = "Results of the [#{comp.name}](https://www.worldcubeassociation.org/results/c.php?i=#{comp.id}) are now available.\n\n"
    elsif top333.length < 3
      render html: "<div class='container'><div class='alert alert-danger'>Too few people competed in 333</div></div>".html_safe
      return
    else
      title = "#{top333.first.personName} wins #{comp.name}"

      body = "[#{top333.first.personName}](https://www.worldcubeassociation.org/results/p.php?i=#{top333.first.personId})"
      body += " won the [#{comp.name}](https://www.worldcubeassociation.org/results/c.php?i=#{comp.id})"
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
    @competition_admin_view = params.has_key?(:competition_admin_view) && current_user.can_admin_results?
    render partial: 'nearby_competitions'
  end

  def time_until_competition
    @competition = Competition.find(params[:id])
    @competition.assign_attributes(competition_params)
    @competition.valid? # We only unpack dates _just before_ validation, so we need to call validation here
    @competition_admin_view = params.has_key?(:competition_admin_view) && current_user.can_admin_results?
    render json: {
      has_date_errors: @competition.has_date_errors?,
      html: render_to_string(partial: 'time_until_competition'),
    }
  end

  def show
    @competition = competition_from_params
    redirect_to "/results/c.php?i=#{@competition.id}"
  end

  def update
    @competition = Competition.find(params[:id])
    @competition_admin_view = params.has_key?(:competition_admin_view) && current_user.can_admin_results?
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
    @competitions = (current_user.delegated_competitions + current_user.organized_competitions + current_user.competitions_registered_for).reject(&:is_over?).uniq.sort_by(&:start_date).reverse!
  end

  private def competition_params
    permitted_competition_params = [
      :use_wca_registration,
      :receive_registration_emails,
      :registration_open,
      :registration_close,
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
          :showAtAll
        ]
      end
    end

    competition_params = params.require(:competition).permit(*permitted_competition_params)
    if competition_params.has_key?(:event_ids)
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
