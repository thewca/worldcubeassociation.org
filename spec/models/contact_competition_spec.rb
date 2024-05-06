# frozen_string_literal: true

require "rails_helper"

RSpec.describe ContactCompetition do
  let(:delegates) { [FactoryBot.create(:delegate), FactoryBot.create(:delegate)] }

  context "to email" do
    it "sends competition inquires to the general WCA contact email when competition id is nil" do
      form = FactoryBot.build(:contact_competition)
      expect(form.competition_id).to be_nil
      expect(form.to_email).to eq "contact@worldcubeassociation.org"
    end

    it "sends competition inquires to the general WCA contact email when competition id is not found" do
      form = FactoryBot.build(:contact_competition, :with_invalid_competition_id)
      expect(form.competition_id).not_to be_nil
      expect(form.to_email).to eq "contact@worldcubeassociation.org"
    end

    it "sends competition inquires to competition contact email when a pure, valid email address is provided for contact" do
      form = FactoryBot.build(:contact_competition, :with_competition, competition_delegates: delegates, competition_contact: "unit-test@speedcubingcanada.org")
      expect(form.to_email).to eq "unit-test@speedcubingcanada.org"
    end

    it "sends competition inquires to competition managers when nothing is provided for contact" do
      form = FactoryBot.build(:contact_competition, :with_competition, competition_delegates: delegates)
      expect(form.to_email).to eq delegates.map(&:email)
    end

    it "sends competition inquires to competition managers when an invalid email address is provided for contact" do
      form = FactoryBot.build(:contact_competition, :with_competition, competition_delegates: delegates, competition_contact: "not an em@il address")
      expect(form.to_email).to eq delegates.map(&:email)
    end

    it "sends competition inquires to competition managers when a markdown email address is provided for contact" do
      form = FactoryBot.build(:contact_competition, :with_competition, competition_delegates: delegates, competition_contact: "[Speedcubing Canada](mailto:unit-test@speedcubingcanada.org)")
      expect(form.to_email).to eq delegates.map(&:email)
    end

    it "sends competition inquires to competition managers when a markdown website is provided for contact" do
      form = FactoryBot.build(:contact_competition, :with_competition, competition_delegates: delegates, competition_contact: "[Speedcubing Canada](unit-test.speedcubingcanada.org)")
      expect(form.to_email).to eq delegates.map(&:email)
    end

    it "sends competition inquires to competition managers when a website is provided for contact" do
      form = FactoryBot.build(:contact_competition, :with_competition, competition_delegates: delegates, competition_contact: "unit-test.speedcubingcanada.org")
      expect(form.to_email).to eq delegates.map(&:email)
    end
  end

  context "subject" do
    it "builds subject line for specific competition inquiry" do
      form = FactoryBot.build(:contact_competition, :with_competition, competition_delegates: delegates)
      competition_name = Competition.find_by_id(form.competition_id).name
      expect(form.subject).to start_with("[WCA Website] Comment for #{competition_name} by #{form.name} on")
    end
  end
end
