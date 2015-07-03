class CompetitionsController < ApplicationController
  before_action :authenticate_user!
  before_action :is_competition_organizer
  before_action :can_admin_results_only, only: [:admin_edit]

  private def is_competition_organizer
    # TODO - allow organizers to edit their own competition
    return true || current_user.can_admin_results?
  end

  def index
    @competitions_grid = initialize_grid(Competition, {
      order: 'year',
      order_direction: 'desc',
      custom_order: {
        # Dirty hack to sort properly with our bizarre date schema.
        # The right thing to do here is to migrate these into a single DATE field.
        'Competitions.year' => lambda do |f|
          order_direction = @competitions_grid.status[:order_direction]
          order_str = "year #{order_direction}, month #{order_direction}, day"
          # Make uninitialized years show up on top when sorting by most recent first.
          if order_direction.to_sym == :desc
            order_str = "year<>0, #{order_str}"
          end
          order_str
        end
      }
    })
    render layout: "application"
  end

  def post_announcement
    comp = Competition.find(params[:id])
    date_range_str = date_range(comp.start_date, comp.end_date)
    title = "#{comp.name} on #{date_range_str} in #{comp.cityName}, #{comp.countryId}"

    body = "The <a href='#{root_url}results/c.php?i=#{comp.id}'>#{comp.name}</a>"
    body += " will take place on #{date_range_str} in #{comp.cityName}, #{comp.countryId}"
    unless comp.website.blank?
      body += " Check out the <a href='#{comp.website_url}'>#{comp.name} website</a> for more information and registration.";
    end
    @post = Post.new(title: title, body: body)
    render 'posts/new', layout: "application"
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
      body = "Results of the <a href='http://www.worldcubeassociation.org/results/c.php?i=#{comp.id}'>#{comp.name}</a> are now available.<br />\n"
    elsif top333.length < 3
      render html: "<div class='container'><div class='alert alert-danger'>Too few people competed in 333</div></div>".html_safe, layout: "application"
      return
    else
      title = "#{top333.first.personName} wins #{comp.name}"

      body = "<a href='http://www.worldcubeassociation.org/results/p.php?i=#{top333.first.personId}'>#{top333.first.personName}</a>"
      body += " won the <a href='http://www.worldcubeassociation.org/results/c.php?i=#{comp.id}'>#{comp.name}</a>"
      body += " with an average of #{top333.first.to_s :average} seconds."

      body += " <a href='http://www.worldcubeassociation.org/results/p.php?i=#{top333.second.personId}'>#{top333.second.personName}</a> finished second (#{top333.second.to_s :average})"

      body += " and <a href='http://www.worldcubeassociation.org/results/p.php?i=#{top333.third.personId}'>#{top333.third.personName}</a> finished third (#{top333.third.to_s :average}).<br />\n"
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
        body += "#{record_strs.join(", ")}.<br />\n"
      end
    end
    @post = Post.new(title: title, body: body)
    render 'posts/new', layout: "application"
  end

  def admin_edit
    @competition = Competition.find(params[:id])
    @admin_view = true
    render 'edit'
  end

  def edit
    @competition = Competition.find(params[:id])
  end

  def update
    @competition = Competition.find(params[:id])
    if @competition.update_attributes(competition_params)
      flash[:success] = "Successfully saved competition"
      if params.has_key?(:admin_view)
        redirect_to admin_edit_competition_path(@competition)
      else
        redirect_to edit_competition_path(@competition)
      end
    else
      render 'edit'
    end
  end

  private def competition_params
    permitted_competition_params = []
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
        :wcaDelegate,
        :organiser,
        :website,
        :showPreregForm,
        :showPreregList,
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
    unless competition_params[:showPreregForm] == "1"
      competition_params[:showPreregList] = "0"
    end
    if params[:commit] == "Confirm"
      competition_params[:isConfirmed] = true
    end
    competition_params
  end
end
