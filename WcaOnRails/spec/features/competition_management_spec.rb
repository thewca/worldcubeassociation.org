# frozen_string_literal: true
require "rails_helper"

RSpec.feature "Competition management" do
  context "when signed in as admin" do
    let(:admin) { FactoryGirl.create :admin }
    before :each do
      sign_in admin
    end

    feature "create a competition" do
      scenario "with valid data" do
        visit "/competitions/new"
        fill_in "Name", with: "My Competition 2015"
        click_button "Create Competition"

        expect(page).to have_text("Successfully created new competition!")
      end

      scenario "with validation errors" do
        visit "/competitions/new"
        click_button "Create Competition"

        expect(page).to have_text("Name must end with a year")
      end
    end

    feature "clone an existing competition" do
      scenario "with valid data" do
        competition = FactoryGirl.create(:competition, :with_delegate)
        visit edit_competition_path(competition)
        click_link "Clone"
        fill_in "Name", with: "Pedro 2016"
        fill_in "Start date", with: "2016-11-30"
        fill_in "End date", with: "2016-11-30"
        click_button "Create Competition"
        expect(page).to have_text("Successfully created new competition!")
      end

      scenario "with validation errors" do
        competition = FactoryGirl.create(:competition, :with_delegate)
        visit edit_competition_path(competition)
        click_link "Clone"
        # See https://github.com/thewca/worldcubeassociation.org/issues/1016#issuecomment-262573451
        fill_in "Start date", with: "2016-11-30"
        fill_in "End date", with: "2016-11-30"
        click_button "Create Competition"
        expect(page).to have_text("Name must end with a year")
      end
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

    scenario "change competition id to invalid id" do
      competition = FactoryGirl.create(:competition, :with_delegate, id: "OldId2016")
      visit edit_competition_path(competition)
      fill_in "ID", with: "NewId With Spaces"
      click_button "Update Competition"

      # When an invalid ID is specified, we silently ignore it. This behavior will
      # get nicer once we have proper immutable ids for competitions.
      expect(page).to have_text("Successfully saved competition.")
      expect(Competition.find("OldId2016")).not_to be_nil
      expect(Competition.find_by_id("NewId With Spaces")).to be_nil
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

  context "when signed in as delegate" do
    let(:delegate) { FactoryGirl.create(:delegate) }
    let(:cloned_delegate) { FactoryGirl.create(:delegate) }
    let(:competition_to_clone) { FactoryGirl.create :competition, cityName: 'Melbourne', delegates: [cloned_delegate], showAtAll: true }

    let(:threes) { Event.find("333") }
    let(:fours) { Event.find("444") }

    before :each do
      sign_in delegate
    end

    scenario 'create competition', js: true do
      visit "/competitions/new"

      fill_in "Name", with: "New Comp 2015"

      click_button "Create Competition"
      expect(page).to have_content "Successfully created new competition!" # wait for request to complete

      expect(Competition.all.length).to eq 1
      new_competition = Competition.find("NewComp2015")
      expect(new_competition.name).to eq "New Comp 2015"
      expect(new_competition.delegates).to eq [delegate]
    end

    scenario 'clone competition', js: true do
      visit clone_competition_path(competition_to_clone)

      fill_in "Name", with: "New Comp 2015"

      expect(page).to have_button('Create Competition')
      click_button "Create Competition"
      expect(page).to have_content "Successfully created new competition!" # wait for request to complete

      expect(Competition.all.length).to eq 2
      new_competition = Competition.find("NewComp2015")
      expect(new_competition.name).to eq "New Comp 2015"
      expect(new_competition.delegates).to eq [delegate, cloned_delegate]
      expect(new_competition.venue).to eq competition_to_clone.venue
      expect(new_competition.showAtAll).to eq false
      expect(new_competition.isConfirmed).to eq false
      expect(new_competition.cityName).to eq 'Melbourne'
    end

    feature "edit" do
      let(:comp_with_fours) { FactoryGirl.create :competition, events: [fours], delegates: [delegate] }

      scenario 'can edit events' do
        visit edit_events_path(comp_with_fours)
        check "competition_events_333"
        uncheck "competition_events_444"
        click_button "Modify Events"

        expect(comp_with_fours.reload.events).to match_array [ threes ]
      end
    end
  end
end
