# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Set the locale" do
  context "As a visitor" do
    let(:user) { FactoryGirl.create :user }

    scenario "visiting the home page and changing the locale" do
      visit "/"
      expect(I18n.locale).to eq I18n.default_locale
      click_on "Français"
      visit "/"
      expect(I18n.locale).to eq :fr
    end

    scenario "signing in updates to the preferred_locale" do
      user.update!(preferred_locale: "fr")
      sign_in user
      visit "/"
      expect(I18n.locale).to eq :fr
    end
  end
end
