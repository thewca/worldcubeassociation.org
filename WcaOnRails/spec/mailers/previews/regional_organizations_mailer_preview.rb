# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/regional_organizations_mailer
class RegionalOrganizationsMailerPreview < ActionMailer::Preview
  def notify_board_and_assistants_of_new_regional_organization_application
    user = User.first
    regional_organization = FactoryBot.create(:regional_organization)
    RegionalOrganizationsMailer.notify_board_and_assistants_of_new_regional_organization_application(user, regional_organization)
  end
end
