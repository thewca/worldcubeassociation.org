# frozen_string_literal: true

require "rails_helper"

RSpec.describe RegionalOrganizationsMailer do
  describe "notify_board_and_assistants_of_new_regional_organization_application" do
    let(:user) { create(:user, name: "John Doe") }
    let(:regional_organization) { create(:regional_organization) }
    let(:mail) do
      I18n.with_locale(:'es-ES') do
        RegionalOrganizationsMailer.notify_board_and_assistants_of_new_regional_organization_application(user, regional_organization)
      end
    end

    it "renders in English" do
      expect(mail.to).to eq(["board@worldcubeassociation.org"])
      expect(mail.cc).to eq(["assistants@worldcubeassociation.org", user.email, regional_organization.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])

      expect(mail.subject).to eq("Regional Organization application - #{regional_organization.name}")
      expect(mail.body.encoded).to match("#{user.name} has submitted an application for #{regional_organization.name} to be acknowledged as a WCA Regional Organization.")
      expect(mail.body.encoded).to match(edit_regional_organization_url(regional_organization))
    end
  end
end
