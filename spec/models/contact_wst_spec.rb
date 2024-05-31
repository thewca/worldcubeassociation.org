# frozen_string_literal: true

require "rails_helper"

RSpec.describe ContactWst do
  context "to email" do
    it "sends inquires related to WST queries to the WCA contact email if no request ID is presesnt" do
      form = FactoryBot.build(:contact_wst)
      expect(form.to_email).to eq "contact@worldcubeassociation.org"
    end

    it "sends inquires related to WST queries to the WST email if request ID is presesnt" do
      form = FactoryBot.build(:contact_wst, request_id: '1234')
      expect(form.to_email).to eq UserGroup.teams_committees_group_wst.metadata.email
    end
  end

  context "subject" do
    it "builds subject line for software inquiry" do
      form = FactoryBot.build(:contact_wst)
      expect(form.subject).to start_with("[WCA Website] Software Comment by #{form.name} on")
    end
  end
end
