# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Registration management" do
  let!(:delegate) { FactoryBot.create :delegate }
  let(:competition) { FactoryBot.create :competition, :registration_open, delegates: [delegate] }

  let!(:user1) { FactoryBot.create :user, name: "Johnny Bravo" }
  let!(:registration1) { FactoryBot.create :registration, user: user1, competition: competition }

  context "when signed in as competition delegate" do
    before :each do
      sign_in delegate
    end

    scenario "smoke test" do
      visit competition_edit_registrations_path(competition)
      expect(page).to have_text("Johnny Bravo")
    end
  end
end
