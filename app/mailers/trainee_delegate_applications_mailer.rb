# frozen_string_literal: true

class TraineeDelegateApplicationsMailer < ApplicationMailer
  # Takes the attributes rather than the application itself, because ActiveJob cannot serialize a non-persisted model.
  def new_application(applicant, application_attributes)
    I18n.with_locale :en do
      application = TraineeDelegateApplication.new(**application_attributes, applicant: applicant)
      @application = application
      @applicant = applicant
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
