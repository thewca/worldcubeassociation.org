# frozen_string_literal: true

require "rails_helper"

RSpec.feature "My competitions page" do
  context "when signed in as user" do
    let!(:user) { FactoryGirl.create :user }

    before do
      sign_in user
    end

    context "after registring for a competition" do
      let!(:competition) { FactoryGirl.create :competition, :visible, :registration_open }
      let!(:registration) { FactoryGirl.create :registration, competition: competition, user: user }

      scenario "the user visits his competitions page" do
        visit "/competitions/mine"
        expect(page).to have_text(competition.name)
      end
    end
  end
end
