# frozen_string_literal: true

class RegionalOrganizationsMailer < ApplicationMailer
  def notify_board_and_assistants_of_new_regional_organization_application(user_who_applied, regional_organization)
    I18n.with_locale :en do
      @user_who_applied = user_who_applied
      @regional_organization = regional_organization
      to = ['board@worldcubeassociation.org']
      cc = ['assistants@worldcubeassociation.org', @user_who_applied.email, @regional_organization.email]
      mail(
        to: to,
        cc: cc,
        reply_to: [@user_who_applied.email],
        subject: "Regional Organization application - #{@regional_organization.name}",
      )
    end
  end
end
