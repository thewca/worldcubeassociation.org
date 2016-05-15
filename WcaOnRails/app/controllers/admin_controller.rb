class AdminController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_unless_user(:can_admin_results?) }

  before_action :compute_navbar_data
  def compute_navbar_data
    @pending_avatars_count = User.where.not(pending_avatar: nil).count
    @pending_media_count = CompetitionsMedia.where(status: 'pending').count
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

  def edit_person
    # This is necessary because the sample form needs some real active record when using user_ids picker.
    # That's only to pass the appropriate attributes.
    @person = Person.new
  end

  def update_person
    @person = Person.find_current_by_id!(params[:person][:id])
    person_params = params.require(:person).permit(:name, :countryId, :gender, :dob)

    case params[:commit]
    when "Fix"
      if @person.update_attributes(person_params)
        flash.now[:success] = "Successfully fixed #{@person.name}."
        if @person.country_id_changed
          flash.now[:warning] = "The change you made may have affected records, be sure to run
          <a href='/results/admin/check_regional_record_markers.php'>check_regional_record_markers</a>.".html_safe
        end
      end
    when "Update"
      if @person.update_using_sub_id(person_params)
        flash.now[:success] = "Successfully updated #{@person.name}."
      end
    end

    render :edit_person
  end

  def person_data
    @person = Person.find_current_by_id!(params[:person_wca_id])

    render json: {
      name: @person.name,
      countryId: @person.countryId,
      gender: @person.gender,
      dob: @person.dob,
    }
  end
end
