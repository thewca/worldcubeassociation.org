# frozen_string_literal: true

require "rails_helper"

EVENT_RESTRICTIONS_REGEX = %r{The Delegates? requested the adoption of <b>event restrictions</b> because ".+".}
EVENTS_PER_REGISTRATION_LIMIT_REGEX = %r{The Delegates? requested an <b>events per registration limit of \d+</b>.}

RSpec.describe "competitions_mailer/notify_wcat_of_confirmed_competition" do
  context "event restrictions" do
    it "does not render bold text regarding event restrictions and events per registration limit" do
      competition = FactoryBot.build(:competition, :confirmed)
      assign(:competition, competition)
      assign(:confirmer, competition.delegates.first)
      render

      expect(rendered).not_to match EVENT_RESTRICTIONS_REGEX
      expect(rendered).not_to match EVENTS_PER_REGISTRATION_LIMIT_REGEX
    end

    it "renders bold text regarding event restrictions and events per registration limit" do
      competition = FactoryBot.build(:competition, :confirmed, :with_event_limit)
      assign(:competition, competition)
      assign(:confirmer, competition.delegates.first)
      render

      expect(rendered).to match EVENT_RESTRICTIONS_REGEX
      expect(rendered).to match EVENTS_PER_REGISTRATION_LIMIT_REGEX
    end

    it "renders bold text regarding event restrictions, but not events per registration limit" do
      competition = FactoryBot.build(:competition, :confirmed, event_restrictions: true, event_restrictions_reason: "reasoning")
      assign(:competition, competition)
      assign(:confirmer, competition.delegates.first)
      render

      expect(rendered).to match EVENT_RESTRICTIONS_REGEX
      expect(rendered).not_to match EVENTS_PER_REGISTRATION_LIMIT_REGEX
    end
  end
end
