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

  def actions_index_for_competition
    @competition = competition_from_params
  end

  def new_results
    @competition = competition_from_params
    @upload_json = UploadJson.new
    @results_validator = CompetitionResultsValidator.new(@competition.id)
  end

  def check_results
    @competition = competition_from_params
    @results_validator = CompetitionResultsValidator.new(@competition.id, true)
  end

  def clear_results_submission
    # Just clear the "results_submitted_at" field to let the Delegate submit
    # the results again. We don't actually want to clear InboxResult and InboxPerson.
    @competition = competition_from_params

    if @competition.results_submitted? && !@competition.results_posted?
      @competition.update_attributes(results_submitted_at: nil)
      flash[:success] = "Results submission cleared."
    else
      flash[:danger] = "Could not clear the results submission. Maybe results are alredy posted, or there is no submission."
    end
    redirect_to competition_admin_upload_results_edit_path
  end

  def create_results
    @competition = competition_from_params

    # Do json analysis + insert record in db, then redirect to check inbox
    # (and delete existing record if any)
    upload_json_params = params.require(:upload_json).permit(:results_file)
    upload_json_params[:competition_id] = @competition.id
    @upload_json = UploadJson.new(upload_json_params)

    # This makes sure the json structure is valid!
    if @upload_json.import_to_inbox
      flash[:success] = "JSON file has been imported."
      redirect_to competition_admin_upload_results_edit_path
    else
      @results_validator = CompetitionResultsValidator.new(@competition.id)
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

  private def competition_from_params
    Competition.find_by_id!(params[:competition_id])
  end
end
