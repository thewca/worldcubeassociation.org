# frozen_string_literal: true

class TraineeDelegateApplicationsController < ApplicationController
  before_action :authenticate_user!

  def new
    application = TraineeDelegateApplication.new(applicant: current_user)

    @trainee_delegate_application_props = {
      applicant: {
        name: current_user.name,
        wca_id: current_user.wca_id,
        email: current_user.email,
        age: application.applicant_age,
        competition_count: application.competition_count,
      },
      eligibilityIssues: application.eligibility_issues,
      minimumAge: TraineeDelegateApplication::MINIMUM_APPLICANT_AGE,
      delegateRegions: application.delegate_region_options,
      volunteerRoleHistory: application.volunteer_role_history,
    }
  end

  def create
    application = TraineeDelegateApplication.new(**trainee_delegate_application_params, applicant: current_user)

    return render json: application.errors, status: :unprocessable_content unless application.save

    TraineeDelegateApplicationsMailer.new_application(application).deliver_later
    render json: { message: I18n.t("trainee_delegate_application.success") }
  end

  private def trainee_delegate_application_params
    params.expect(
      trainee_delegate_application: [
        :delegate_region_id,
        :introduction,
        :competition_contributions,
        :volunteer_history,
        :motivation,
        :relevant_skills,
        :is_involved_in_cubing_business,
        :cubing_business_involvement_details,
        { spoken_to_delegate_ids: [],
          recommender_ids: [],
          declarations: TraineeDelegateApplication::DECLARATIONS },
      ],
    )
  end
end
