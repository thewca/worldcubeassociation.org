class CompetitionsController < ApplicationController
  before_action :authenticate_user!
  before_action :can_admin_results_only, only: [:new, :index, :create, :post_announcement, :post_results, :admin_edit]
  before_action :can_manage_competition_only, only: [:edit, :update]

  private def can_manage_competition_only
    # TODO - it would be nice if our routes used competition_id everywhere, instead of id
    competition = Competition.find(params[:competition_id] || params[:id])
    unless current_user && current_user.can_manage_competition?(competition)
      flash[:danger] = "You are not allowed to manage this competition"
      redirect_to root_url
    end
  end

  private def competitions
    Competition.all.select([:id, :name, :cityName, :countryId]).order(:year, :month, :day).reverse_order
  end

  def new
    @js_competitions = @competitions = competitions
    @competition = Competition.new

    render layout: "application"
  end

  def index
    @js_competitions = @competitions = competitions
    render layout: "application"
  end

  def create
    new_competition_params = params.require(:competition).permit(:id, :competition_id_to_clone)
    if new_competition_params[:competition_id_to_clone].blank?
      # Creating a blank competition.
      @competition = Competition.new(new_competition_params)
      # Dummy data to pass validation.
      @competition.name = @competition.cellName = "Placeholder #{Time.now.year}"
    else
      # Cloning an existing competition!
      competition_to_clone = Competition.find_by_id(new_competition_params[:competition_id_to_clone])
      if competition_to_clone
        # Don't clone the showAtAll or isConfirmed bits.
        @competition = Competition.new(competition_to_clone.as_json.merge(new_competition_params).merge(showAtAll: false, isConfirmed: false))
        @competition.organizers = competition_to_clone.organizers
        @competition.delegates = competition_to_clone.delegates
      else
        @competition = Competition.new(new_competition_params)
        @competition.errors[:competition_id_to_clone] = "invalid"
      end
    end

    if @competition.errors.size == 0 && @competition.save
      if competition_to_clone
        flash[:success] = "Successfully cloned #{competition_to_clone.id}!"
      else
        flash[:success] = "Successfully created new competition!"
      end
      redirect_to admin_edit_competition_path(@competition)
    else
      @js_competitions = @competitions = competitions
      render 'new', layout: "application"
    end
  end

  private def post_post(post)
    @post = post
    if @post.save
      flash[:success] = "Created new post"
      redirect_to post_path(@post.slug)
    else
      render 'posts/new', layout: "application"
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
      body += " Check out the [#{comp.name} website](#{comp.website_url}) for more information and registration.";
    end
    @post = Post.new(title: title, body: body, author: current_user, sticky: false)
    post_post(@post)
  end

  def post_results
    comp = Competition.find(params[:id])
    unless comp.results
      render html: "<div class='container'><div class='alert alert-warning'>No results</div></div>".html_safe, layout: "application"
      return
    end

    top333 = comp.results.where(eventId: '333', roundId: ['f', 'c']).order(:pos).limit(3)
    if top333.empty? # If there was no 3x3x3 event.
      title = "Results of #{comp.name} posted"
      body = "Results of the [#{comp.name}](http://www.worldcubeassociation.org/results/c.php?i=#{comp.id}) are now available.\n\n"
    elsif top333.length < 3
      render html: "<div class='container'><div class='alert alert-danger'>Too few people competed in 333</div></div>".html_safe, layout: "application"
      return
    else
      title = "#{top333.first.personName} wins #{comp.name}"

      body = "[#{top333.first.personName}](http://www.worldcubeassociation.org/results/p.php?i=#{top333.first.personId})"
      body += " won the [#{comp.name}](http://www.worldcubeassociation.org/results/c.php?i=#{comp.id})"
      body += " with an average of #{top333.first.to_s :average} seconds."

      body += " [#{top333.second.personName}](http://www.worldcubeassociation.org/results/p.php?i=#{top333.second.personId}) finished second (#{top333.second.to_s :average})"

      body += " and [#{top333.third.personName}](http://www.worldcubeassociation.org/results/p.php?i=#{top333.third.personId}) finished third (#{top333.third.to_s :average}).\n\n"
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
              # Append their WCA ids to distinguish between them.
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
    post = Post.new(title: title, body: body, author: current_user, sticky: false)
    post_post(post)
  end

  private def render_edit
    @js_users = (@competition.delegates + @competition.organizers).uniq
    render 'edit'
  end

  def admin_edit
    @competition = Competition.find(params[:id])
    @admin_view = true
    render_edit
  end

  def edit
    @competition = Competition.find(params[:id])
    render_edit
  end

  def update
    @competition = Competition.find(params[:id])
    @admin_view = params.has_key?(:admin_view)
    if params[:commit] == "Delete" && current_user.can_admin_results?
      # Only allow results admins to delete competitions.
      @competition.destroy
      flash[:success] = "Successfully deleted competition #{@competition.id}"
      redirect_to competitions_path
    elsif @competition.update_attributes(competition_params)
      flash[:success] = "Successfully saved competition"
      if @admin_view
        redirect_to admin_edit_competition_path(@competition)
      else
        redirect_to edit_competition_path(@competition)
      end
    else
      render_edit
    end
  end

  private def competition_params
    permitted_competition_params = [
      :showPreregForm,
      :showPreregList,
    ]
    if @competition.isConfirmed? && !current_user.can_admin_results?
      # If the competition is confirmed, non admins are not allowed to change anything.
    else
      permitted_competition_params += [
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
    if params[:commit] == "Confirm"
      competition_params[:isConfirmed] = true
    end
    competition_params[:editing_user_id] = current_user.id
    competition_params
  end
end
