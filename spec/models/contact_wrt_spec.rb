# frozen_string_literal: true

require "rails_helper"

RSpec.describe ContactWrt do
  context "to email" do
    it "sends inquires related to WRT queries to the WRT email" do
      form = FactoryBot.build(:contact_wrt)
      expect(form.to_email).to eq UserGroup.teams_committees_group_wrt.metadata.email
    end
  end

  context "subject" do
    it "builds subject line for WRT inquiry" do
      form = FactoryBot.build(:contact_wrt)
      expect(form.subject).to start_with("[WCA Website] Results Team Comment by #{form.name} on")
    end
  end
end
