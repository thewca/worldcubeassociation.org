# frozen_string_literal: true

class TraineeDelegateApplicationsMailer < ApplicationMailer
  def new_application(application)
    I18n.with_locale :en do
      @application = application
      @applicant = application.applicant
      @volunteer_role_history = application.volunteer_role_history

      reviewer_email = application.reviewer.email
      mail(
        to: reviewer_email,
        cc: [application.senior_delegate&.email, @applicant.email, "assistants@worldcubeassociation.org"].compact.uniq - [reviewer_email],
        reply_to: @applicant.email,
        subject: "Trainee Delegate application - #{@applicant.name} (#{application.delegate_region_name})",
      )
    end
  end
end
