# frozen_string_literal: true
require "rails_helper"

RSpec.feature "Competition management" do
  context "when signed in as admin" do
    let(:admin) { FactoryGirl.create :admin }
    before :each do
      sign_in admin
    end

    scenario "User creates a new competition" do
      visit "/competitions/new"
      fill_in "Name", with: "My Competition 2015"
      click_button "Create Competition"

      expect(page).to have_text("Successfully created new competition!")

      visit "/competitions/new"
      click_button "Create Competition"

      expect(page).to have_text("Name must end with a year")
    end

    scenario "User clones an existing competition" do
      competition = FactoryGirl.create(:competition, :with_delegate)
      visit edit_competition_path(competition)
      click_link "Clone"
      # See https://github.com/thewca/worldcubeassociation.org/issues/1016#issuecomment-262573451
      fill_in "Start date", with: "2016-11-30"
      fill_in "End date", with: "2016-11-30"
      click_button "Create Competition"
      expect(page).to have_text("Name must end with a year")
    end

    scenario "User confirms a competition" do
      competition = FactoryGirl.create(:competition, :with_delegate)
      visit edit_competition_path(competition)
      click_button "Confirm"

      expect(page).to have_text("Successfully confirmed competition.")
    end

    scenario "change competition id" do
      competition = FactoryGirl.create(:competition, :with_delegate)
      visit edit_competition_path(competition)
      fill_in "ID", with: "NewId2016"
      click_button "Update Competition"

      expect(page).to have_text("Successfully saved competition.")
      expect(Competition.find("NewId2016")).not_to be_nil
    end

    scenario "change competition id with validation error" do
      competition = FactoryGirl.create(:competition, :with_delegate, id: "OldId2016")
      visit edit_competition_path(competition)
      fill_in "ID", with: "NewId2016"
      fill_in "Name", with: "Name that does not end in a year"
      click_button "Update Competition"

      expect(page).to have_text("Name must end with a year")
      expect(page).to have_selector("input#competition_id[value='OldId2016']")

      fill_in "Name", with: "Name that does end in 2016"
      fill_in "ID", with: "NewId2016"
      click_button "Update Competition"

      expect(page).to have_text("Successfully saved competition.")
      c = Competition.find("NewId2016")
      expect(c).not_to be_nil
      expect(c.name).to eq "Name that does end in 2016"
    end
  end
end
