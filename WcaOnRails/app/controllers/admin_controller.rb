# frozen_string_literal: true

require 'csv'

class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }, except: [:all_voters, :leader_senior_voters]
  before_action -> { redirect_to_root_unless_user(:can_see_eligible_voters?) }, only: [:all_voters, :leader_senior_voters]

  before_action :compute_navbar_data
  def compute_navbar_data
    @pending_avatars_count = User.where.not(pending_avatar: nil).count
    @pending_media_count = CompetitionMedium.pending.count
  end

  def index
  end

  def merge_people
    @merge_people = MergePeople.new
  end

  def do_merge_people
    merge_params = params.require(:merge_people).permit(:person1_wca_id, :person2_wca_id)
    @merge_people = MergePeople.new(merge_params)
    if @merge_people.do_merge
      flash.now[:success] = "Successfully merged #{@merge_people.person2_wca_id} into #{@merge_people.person1_wca_id}!"
      @merge_people = MergePeople.new
    else
      flash.now[:danger] = "Error merging"
    end
    render 'merge_people'
  end

  def new_results
    @competition = Competition.find(params.require(:competition_id))
    @upload_json = UploadJson.new
    @inbox_results = InboxResult.sorted_for_competition(@competition.id)
    @inbox_persons = InboxPerson.where(competitionId: @competition.id)
    @scrambles = Scramble.where(competitionId: @competition.id)
    @all_errors = []
    @all_warnings = []
    if @inbox_results.any?
      @all_errors, @all_warnings = CompetitionResultsValidator.validate(@inbox_persons, @inbox_results, @scrambles, @competition.id)
    end
    @total_errors = @all_errors.map { |key, value| value }.map(&:size).reduce(:+) || 0
    @total_warnings = @all_warnings.map { |key, value| value }.map(&:size).reduce(:+) || 0
  end

  def create_results
    # FIXME: check for any existing inboxresults or existing results
    @competition = Competition.find(params.require(:competition_id))

    # Do json analysis + insert record in db, then redirect to check inbox
    # (and delete existing record if any)
    upload_json_params = params.require(:upload_json).permit(:results_file)
    upload_json_params[:competition_id] = @competition.id
    @upload_json = UploadJson.new(upload_json_params)
    @results_submission = ResultsSubmission.new

    # This makes sure the json structure is valid!
    if @upload_json.valid?
      # FIXME: to attribute
      json = JSON.parse(@upload_json.results_json_str)
      persons_to_import = []
      json["persons"].each do |p|
        new_person_attributes = p.merge(competitionId: @competition.id)
        # TODO: index on (competition_id, personId) to raise stuff
        persons_to_import << InboxPerson.new(new_person_attributes)
      end
      results_to_import = []
      scrambles_to_import = []
      json["events"].each do |event|
        event["rounds"].each do |round|
          round["results"].each do |result|
            individual_results = result["results"]
            # Pad the results with 0 up to 5 results
            individual_results.fill(0, individual_results.length...5)
            new_result_attributes = {
              personId: result["personId"],
              pos: result["position"],
              eventId: event["eventId"],
              roundTypeId: round["roundId"],
              formatId: round["formatId"],
              best: result["best"],
              average: result["average"],
              value1: individual_results[0],
              value2: individual_results[1],
              value3: individual_results[2],
              value4: individual_results[3],
              value5: individual_results[4],
            }
            new_res = InboxResult.new(new_result_attributes)
            # Using this way of setting the attribute saves one SELECT per result
            # to validate the competition presence.
            # (a lot of time considering all the results to import!)
            new_res.competition = @competition
            results_to_import << new_res

            # Import scrambles
            round["groups"].each do |group|
              ["scrambles", "extraScrambles"].each do |scramble_type|
                group[scramble_type].each_with_index do |scramble, index|
                  new_scramble_attributes = {
                    competitionId: @competition.id,
                    eventId: event["eventId"],
                    roundTypeId: round["roundId"],
                    groupId: group["group"],
                    isExtra: scramble_type == "extraScrambles",
                    scrambleNum: index+1,
                    scramble: scramble,
                  }
                  scrambles_to_import << Scramble.new(new_scramble_attributes)
                end
              end
            end
          end
        end
      end
      begin
        ActiveRecord::Base.transaction do
          InboxPerson.where(competitionId: @competition.id).delete_all
          InboxResult.where(competitionId: @competition.id).delete_all
          Scramble.where(competitionId: @competition.id).delete_all
          InboxPerson.import!(persons_to_import)
          Scramble.import!(scrambles_to_import)
          InboxResult.import!(results_to_import)
        end
      rescue ActiveRecord::RecordInvalid => invalid
        object = invalid.record
        if object.class == Scramble
          @upload_json.errors.add(:results_file, "Scramble in round #{object.roundTypeId} of event #{object.eventId} is invalid (#{invalid.message}), please fix it!")
        elsif object.class == InboxPerson
          @upload_json.errors.add(:results_file, "Person #{object.name} is invalid (#{invalid.message}), please fix it!")
        elsif object.class == InboxResult
          @upload_json.errors.add(:results_file, "Result for person #{object.personId} in round #{object.roundTypeId} of event #{object.eventId} is invalid (#{invalid.message}), please fix it!")
        else
          # FIXME: that's actually not supposed to happen, as the only 3 types of records we create are above
          @upload_json.errors.add(:results_file, "An invalid record prevented the results from being created: #{invalid.message}")
        end
      end
      flash[:success] = "JSON File has been imported."
      redirect_to competition_admin_upload_results_edit_path
    else
      # FIXME: maybe we should clear in any case? otherwise we would display errors/warning for inbox while trying to import another json
      @inbox_results = InboxResult.where(competitionId: @competition.id)
      @all_errors = []
      @all_warnings = []
      @total_errors = 0
      @total_warnings = 0
      render :new_results
    end
  end

  def edit_person
    @person = Person.current.find_by(wca_id: params[:person].try(:[], :wca_id))
    # If there isn't a person in the params, make an empty one that simple form have an object to work with.
    # Note: most of the time persons are dynamically selected using user_id picker.
    @person ||= Person.new
  end

  def update_person
    @person = Person.current.find_by(wca_id: params[:person][:wca_id])
    if @person
      person_params = params.require(:person).permit(:name, :countryId, :gender, :dob)
      case params[:method]
      when "fix"
        if @person.update_attributes(person_params)
          flash.now[:success] = "Successfully fixed #{@person.name}."
          if @person.saved_change_to_countryId?
            flash.now[:warning] = "The change you made may have affected national and continental records, be sure to run
            <a href='/results/admin/check_regional_record_markers.php'>check_regional_record_markers</a>.".html_safe
          end
        else
          flash.now[:danger] = "Error while fixing #{@person.name}."
        end
      when "update"
        if @person.update_using_sub_id(person_params)
          flash.now[:success] = "Successfully updated #{@person.name}."
        else
          flash.now[:danger] = "Error while updating #{@person.name}."
        end
      end
    else
      @person = Person.new
      flash.now[:danger] = "No person has been chosen."
    end
    render :edit_person
  end

  def person_data
    @person = Person.current.find_by!(wca_id: params[:person_wca_id])

    render json: {
      name: @person.name,
      countryId: @person.countryId,
      gender: @person.gender,
      dob: @person.dob,
    }
  end

  def compute_auxiliary_data
    @reason_not_to_run = ComputeAuxiliaryData.reason_not_to_run
  end

  def do_compute_auxiliary_data
    ComputeAuxiliaryData.perform_later unless ComputeAuxiliaryData.in_progress?
    redirect_to admin_compute_auxiliary_data_path
  end

  def all_voters
    voters User.eligible_voters, "all-wca-voters"
  end

  def leader_senior_voters
    voters User.leader_senior_voters, "leader-senior-wca-voters"
  end

  private def voters(users, filename)
    csv = CSV.generate do |line|
      users.each do |user|
        line << [user.id, user.email, user.name]
      end
    end
    send_data csv, filename: "#{filename}-#{Time.now.utc.iso8601}.csv", type: :csv
  end

  def update_statistics
    Dir.chdir('../webroot/results') { `php statistics.php update >/dev/null 2>&1 &` }
    flash[:info] = "Computation of the statistics has been started, it should take several minutes.
                    Note that you will receive no information about the outcome,
                    also please don't queue up multiple simultaneous statistics computations."
    redirect_to admin_url
  end
end
