# frozen_string_literal: true

require "rails_helper"

def find_competition_input(label_text)
  find('label', text: label_text, match: :first).find(:xpath, './following-sibling::div/input')
end

def find_competition_checkbox_input(label_text)
  find('label', text: label_text, match: :first).find(:xpath, './preceding-sibling::input', visible: false)
end

def set_competition_checkbox_input(label_text, value)
  label = find('label', text: label_text, match: :first)
  input = label.find(:xpath, './preceding-sibling::input', visible: false)
  if input.checked? != value
    label.click
  end
end

def find_modal(&)
  all(:css, '.modal.visible', &).last
end

def within_modal(&)
  within(find_modal(&))
end


RSpec.feature "Competition management", js: true do
  context "when signed in as admin" do
    let!(:admin) { FactoryBot.create :admin }
    before :each do
      sign_in admin
    end

    feature "create a competition" do
      scenario "with valid data" do
        visit "/competitions/new"
        fill_in "Name", with: "My Competition 2015"
        select "United States", from: "Region"
        uncheck "I would like to use the WCA website for registration"
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
        competition = FactoryBot.create(:competition, :with_delegate)
        visit edit_competition_path(competition)
        click_link "Clone"
        fill_in "Name", with: "Pedro 2016"
        fill_in "Start date", with: "2016-11-30"
        fill_in "End date", with: "2016-11-30"
        click_button "Create Competition"
        expect(page).to have_text("Successfully created new competition!")
      end

      scenario "with validation errors" do
        competition = FactoryBot.create(:competition, :with_delegate)
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
      competition = FactoryBot.create(:competition, :with_delegate, :with_valid_schedule)
      visit edit_competition_path(competition)
      click_button "Confirm"

      within_modal do
        click_button "Yes"
      end

      expect(page).to have_text("You've confirmed this competition")
    end

    scenario "change competition id of long name" do
      competition = FactoryBot.create(:competition, :with_delegate, name: "competition name id modify long 2016")
      visit edit_competition_path(competition)
      fill_in "ID", with: "NewId2016"
      click_button "Update Competition"

      expect(page).to have_text("Successfully saved competition.")
      expect(Competition.find("NewId2016")).not_to be_nil
    end

    scenario "change competition id to invalid id" do
      competition = FactoryBot.create(:competition, :with_delegate, id: "OldId2016", name: "competition name id modify as admin 2016")
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
      competition = FactoryBot.create(:competition, :with_delegate, id: "OldId2016", name: "competition name id modify as admin 2016")
      visit edit_competition_path(competition)
      fill_in "ID", with: "NewId2016"
      fill_in "Name", with: "Name that does not end in a year but is long"
      click_button "Update Competition"

      expect(page).to have_text("Name must end with a year")
      expect(page).to have_selector("input#competition_id[value='OldId2016']")

      fill_in "Name", with: "Name that is long and does end in year 2016"
      fill_in "ID", with: "NewId2016"
      click_button "Update Competition"

      expect(page).to have_text("Successfully saved competition.")
      c = Competition.find("NewId2016")
      expect(c).not_to be_nil
      expect(c.name).to eq "Name that is long and does end in year 2016"
    end

    scenario "custom approved ID not changing on confirmed competitions from organizer view" do
      competition = FactoryBot.create(:competition, :confirmed, id: "OldId2016", name: "competition name short 2016")
      visit edit_competition_path(competition)
      click_button "Update Competition"

      c = Competition.find("OldId2016")
      expect(c).not_to be_nil
    end

    scenario "can change id of short name from admin view" do
      competition = FactoryBot.create(:competition, :with_delegate, id: "OldId2016", name: "competition name short 2016")
      visit competition_admin_edit_path(competition)
      fill_in "ID", with: "NewId2016"
      click_button "Update Competition"

      c = Competition.find("NewId2016")
      expect(c).not_to be_nil
    end

    scenario "cannot change id of short name from organizer view" do
      competition = FactoryBot.create(:competition, :with_delegate, id: "OldId2016", name: "competition name short 2016")
      visit edit_competition_path(competition)
      expect { fill_in "ID", with: "NewId2016" }.to raise_error(Capybara::ElementNotFound)
    end

    scenario "change guest entry fee to zero" do
      competition = FactoryBot.create(:competition, :with_delegate, id: "OldId2016", guests_entry_fee_lowest_denomination: 0)
      visit edit_competition_path(competition)

      expect(page).to have_text("Display message for free guest entry")
    end

    scenario "change guest entry fee to non-zero", js: true, retry: 3 do
      competition = FactoryBot.create(:competition, :with_delegate, id: "OldId2016", guests_entry_fee_lowest_denomination: 666)
      visit edit_competition_path(competition)

      expect(page).not_to have_text("Display message for free guest entry")
    end

    scenario "select free guest entry status" do
      competition = FactoryBot.create(:competition, :with_delegate, id: "OldId2016", guest_entry_status: Competition.guest_entry_statuses['free'])
      visit competition_path(competition)
      find('div', id: 'show_registration_requirements').click_link('here')

      expect(page).to have_text("Any spectator can attend for free.")
    end

    scenario "select restricted guest entry status" do
      competition = FactoryBot.create(:competition, :with_delegate, id: "OldId2016", guest_entry_status: Competition.guest_entry_statuses['restricted'])
      visit competition_path(competition)
      find('div', id: 'show_registration_requirements').click_link('here')

      expect(page).to have_text("Spectators are only permitted as companions of competitors.")
    end
  end

  context "when signed in as delegate" do
    let!(:delegate) { FactoryBot.create(:delegate) }
    let(:cloned_delegate) { FactoryBot.create(:delegate) }
    let(:competition_to_clone) { FactoryBot.create :competition, cityName: 'Melbourne, Victoria', countryId: "Australia", delegates: [cloned_delegate], showAtAll: true }

    let(:threes) { Event.find("333") }
    let(:fours) { Event.find("444") }

    before :each do
      sign_in delegate
    end

    scenario 'example test', js: true do
      visit "/competitions/new"

      find_competition_input('Name').set('New Comp 2015 lol')
      set_competition_checkbox_input('I would like to use the WCA website for registration', true)
      set_competition_checkbox_input('I would like to use the WCA website for registration', false)
      set_competition_checkbox_input('I would like to use the WCA website for registration', true)

      click_button 'Show Debug'

      expect(find_competition_input('Name').value).to eq 'New Comp 2015 lol'
      puts "======"
      puts "======"
      puts "======"
      print page.html
      puts "======"
      puts "======"
      puts "======"
    end

    scenario 'create competition', js: true, retry: 3 do
      visit "/competitions/new"

      fill_in "Name", with: "New Comp 2015"
      select "United States", from: "Region"
      uncheck "I would like to use the WCA website for registration"
      click_button "Create Competition"
      expect(page).to have_content "Successfully created new competition!" # wait for request to complete

      expect(Competition.all.length).to eq 1
      new_competition = Competition.find("NewComp2015")
      expect(new_competition.name).to eq "New Comp 2015"
      expect(new_competition.delegates).to eq [delegate]
    end

    scenario "id and cellName changes for short comp name" do
      competition = FactoryBot.create(:competition, delegates: [delegate], id: "competitionnameshort2016", name: "competition name short 2016")
      visit edit_competition_path(competition)
      fill_in "Name", with: "New Id 2016"

      click_button "Update Competition"

      c = Competition.find("NewId2016")
      expect(c).not_to be_nil
      expect(c.cellName).to eq "New Id 2016"
    end

    scenario 'clone competition', js: true, retry: 3 do
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
      expect(new_competition.confirmed?).to eq false
      expect(new_competition.cityName).to eq 'Melbourne, Victoria'
    end

    feature "edit" do
      let(:comp_with_fours) { FactoryBot.create :competition, events: [fours], delegates: [delegate] }

      scenario 'can edit registration open datetime', js: true, retry: 3 do
        visit edit_competition_path(comp_with_fours)
        find_field("I would like to use the WCA website for registration", :visible => :all, :disabled => :all).check

        expect(page).not_to have_selector(".bootstrap-datetimepicker-widget .datepicker")
        expect(page).not_to have_selector(".bootstrap-datetimepicker-widget .timepicker")
        find('#competition_registration_open').click
        expect(page).to have_selector(".bootstrap-datetimepicker-widget .datepicker")
        expect(page).to have_selector(".bootstrap-datetimepicker-widget .timepicker")
      end
    end
  end
end
