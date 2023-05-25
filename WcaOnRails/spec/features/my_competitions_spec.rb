# frozen_string_literal: true

require "rails_helper"

RSpec.feature "My competitions page", clean_db_with_truncation: true do
  context "when signed in as user" do
    let!(:user) { FactoryBot.create :user }

    before do
      sign_in user
    end

    context "after registring for a competition" do
      let!(:competition) { FactoryBot.create :competition, :visible, :registration_open }
      let!(:registration) { FactoryBot.create :registration, :accepted, competition: competition, user: user }

      scenario "the user visits his competitions page" do
        visit "/competitions/mine"
        expect(page).to have_text(competition.name)
      end
    end
  end
end
