# frozen_string_literal: true

require "rails_helper"

RSpec.describe WebsiteContact do
  context "to email" do
    let(:competition_managers) { [FactoryBot.create(:delegate), FactoryBot.create(:delegate)] }

    it "sends inquires not regarding a specific competition to the general WCA contact email" do
      form = FactoryBot.build(:website_contact, :general_competitions_inquiry)
      expect(form.inquiry).not_to eq "competition"
      expect(form.to_email).to eq "contact@worldcubeassociation.org"
    end

    it "sends competition inquires to the general WCA contact email when competition id is nil" do
      form = FactoryBot.build(:website_contact, :specific_competition_inquiry)
      expect(form.competition_id).to be_nil
      expect(form.to_email).to eq "contact@worldcubeassociation.org"
    end

    it "sends competition inquires to the general WCA contact email when competition id is not found" do
      form = FactoryBot.build(:website_contact, :specific_competition_inquiry, :with_invalid_competition_id)
      expect(form.competition_id).not_to be_nil
      expect(form.to_email).to eq "contact@worldcubeassociation.org"
    end

    it "sends competition inquires to competition contact email when a pure, valid email address is provided for contact" do
      form = FactoryBot.build(:website_contact, :specific_competition_inquiry, :with_competition, competition_managers: competition_managers, competition_contact: "unit-test@speedcubingcanada.org")
      expect(form.to_email).to eq "unit-test@speedcubingcanada.org"
    end

    it "sends competition inquires to competition managers when nothing is provided for contact" do
      form = FactoryBot.build(:website_contact, :specific_competition_inquiry, :with_competition, competition_managers: competition_managers)
      expect(form.to_email).to eq competition_managers.map(&:email)
    end

    it "sends competition inquires to competition managers when an invalid email address is provided for contact" do
      form = FactoryBot.build(:website_contact, :specific_competition_inquiry, :with_competition, competition_managers: competition_managers, competition_contact: "not an em@il address")
      expect(form.to_email).to eq competition_managers.map(&:email)
    end

    it "sends competition inquires to competition managers when a markdown email address is provided for contact" do
      form = FactoryBot.build(:website_contact, :specific_competition_inquiry, :with_competition, competition_managers: competition_managers, competition_contact: "[Speedcubing Canada](mailto:unit-test@speedcubingcanada.org)")
      expect(form.to_email).to eq competition_managers.map(&:email)
    end

    it "sends competition inquires to competition managers when a markdown website is provided for contact" do
      form = FactoryBot.build(:website_contact, :specific_competition_inquiry, :with_competition, competition_managers: competition_managers, competition_contact: "[Speedcubing Canada](unit-test.speedcubingcanada.org)")
      expect(form.to_email).to eq competition_managers.map(&:email)
    end

    it "sends competition inquires to competition managers when a website is provided for contact" do
      form = FactoryBot.build(:website_contact, :specific_competition_inquiry, :with_competition, competition_managers: competition_managers, competition_contact: "unit-test.speedcubingcanada.org")
      expect(form.to_email).to eq competition_managers.map(&:email)
    end    
  end
end
