# frozen_string_literal: true

require "rails_helper"

RSpec.feature "My competitions page", clean_db_with_truncation: true do
  context "when signed in as user" do
    let!(:user) { create(:user) }

    before do
      sign_in user
    end

    context "after registring for a competition" do
      let!(:competition) { create(:competition, :visible, :registration_open) }
      let!(:registration) { create(:registration, :accepted, competition: competition, user: user) }

      scenario "the user visits his competitions page" do
        pending("Pending until we find a way to test React components signed icklerf 10-12-2024")
        visit "/competitions/mine"
        expect(page).to have_text(competition.name)
      end
    end
  end
end
