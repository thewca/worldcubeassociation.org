# frozen_string_literal: true

require "rails_helper"

RSpec.feature "My competitions page", :js do
  context "when signed in as user" do
    let!(:user) { create(:user) }

    before do
      sign_in user
    end

    context "after registring for a competition" do
      let!(:competition) { create(:competition, :visible, :registration_open) }
      let!(:registration) { create(:registration, :accepted, competition: competition, user: user) }

      scenario "the user visits his competitions page" do
        visit "/competitions/mine"

        # The MyCompetitions React on Rails component renders the registered
        # competition into the upcoming competitions table, so seeing its name
        # proves the component rendered the data passed from the controller.
        expect(page).to have_text(competition.name)
      end
    end
  end
end
