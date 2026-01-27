# frozen_string_literal: true

require "rails_helper"

# This part of our React suite is particularly slow in the CI
#   so until we find a more modern browser engine to run our test
#   we counter-steer by setting the wait time ludicrously high
SLUGGISH_WAIT_TIME = 5

def find_modal(&)
  all(:css, '.modal.visible', &).last
end

def within_modal(&)
  within(find_modal(&))
end

# HTML 'select' dropdowns in SemUI are not actual <select> fields.
# They are patched together as a combination of <div>s, so we have to write our custom find method.
def region_input
  all(:css, 'div#venue-countryId>input.search').last
end

# HTML 'checkbox' elements in SemUI are not actual <checkbox> fields.
# They are a label with a rectangle and a tick mark injected via CSS, so we have to write our custom find method.
def wca_registration_checkbox
  # WARNING: Do not use Capybara "unckeck" on this, because it technically (in the HTML sense) isn't even a checkbox.
  all(:css, "label[for='website-usesWcaRegistration']").last
end

RSpec.feature "Competition management", :js do
  context "when signed in as admin" do
    let!(:admin) { create(:admin) }

    before :each do
      sign_in admin
    end

    feature "create a competition" do
      scenario "with valid data" do
        visit new_competition_path
        fill_in "Name", with: "My Competition 2015"
        region_input.fill_in with: "United States"
        fill_in "Start date", with: '08/11/2015'
        fill_in "End date", with: '08/11/2015'
        wca_registration_checkbox.click
        fill_in "Maximum number of competitors", with: '123'
        fill_in "The reason for the competitor limit", with: 'Because it is required'

        click_button "Create Competition"

        # Force Capybara to wait until the page finishes updating
        expect(page).to have_current_path(edit_competition_path("MyCompetition2015"), wait: SLUGGISH_WAIT_TIME)
      end

      scenario "with validation errors" do
        visit new_competition_path
        click_button "Create Competition"

        expect(page).to have_text("must end with a year", wait: SLUGGISH_WAIT_TIME)
      end
    end

    feature "clone an existing competition" do
      scenario "with valid data" do
        competition = create(:competition, :with_delegate)
        visit edit_competition_path(competition)
        click_link "Clone"
        fill_in "Name", with: "Pedro 2016"
        fill_in "Start date", with: "2016-11-30"
        fill_in "End date", with: "2016-11-30"
        click_button "Create Competition"

        # Force Capybara to wait until the page finishes updating
        expect(page).to have_current_path(edit_competition_path("Pedro2016"), wait: SLUGGISH_WAIT_TIME)
      end

      scenario "with validation errors" do
        competition = create(:competition, :with_delegate)
        visit edit_competition_path(competition)
        click_link "Clone"
        # See https://github.com/thewca/worldcubeassociation.org/issues/1016#issuecomment-262573451
        fill_in "Start date", with: "2016-11-30"
        fill_in "End date", with: "2016-11-30"
        click_button "Create Competition"

        expect(page).to have_text("must end with a year", wait: SLUGGISH_WAIT_TIME)
      end
    end

    scenario "User confirms a competition" do
      competition = create(:competition, :future, :with_delegate, :with_organizer, :with_valid_schedule)
      visit edit_competition_path(competition)
      click_button "Confirm"

      within_modal do
        click_button "Yes"
      end

      expect(page).to have_text("You've confirmed this competition", wait: SLUGGISH_WAIT_TIME)
    end

    scenario "change competition id of long name" do
      competition = create(:competition, :with_delegate, name: "competition name id modify long 2016")
      visit edit_competition_path(competition)

      fill_in "ID", with: "NewId2016"
      click_button "Update Competition"

      # Force Capybara to wait until the page finishes updating
      expect(page).to have_current_path(edit_competition_path("NewId2016"), wait: SLUGGISH_WAIT_TIME)

      expect(page).to have_text("This competition is not visible to the public.")
      expect(page).to have_no_text("You have unsaved changes")

      expect(Competition.find("NewId2016")).not_to be_nil
    end

    scenario "change competition id to invalid id" do
      competition = create(:competition, :with_delegate, id: "OldId2016", name: "competition name id modify as admin 2016")
      visit edit_competition_path(competition)
      fill_in "ID", with: "NewId With Spaces"
      click_button "Update Competition"

      # When an invalid ID is specified, we silently ignore it. This behavior will
      # get nicer once we have proper immutable ids for competitions.
      expect(page).to have_current_path(edit_competition_path("OldId2016"), wait: SLUGGISH_WAIT_TIME)

      expect(Competition.find("OldId2016")).not_to be_nil
      expect(Competition.find_by(competition_id: "NewId With Spaces")).to be_nil
    end

    scenario "change competition id with validation error" do
      competition = create(:competition, :with_delegate, id: "OldId2016", name: "competition name id modify as admin 2016")
      visit edit_competition_path(competition)
      fill_in "ID", with: "NewId2016"
      fill_in "Name", with: "Name that does not end in a year but is long"
      click_button "Update Competition"

      expect(page).to have_button("save your changes!", wait: SLUGGISH_WAIT_TIME)
      expect(page).to have_text("must end with a year", wait: SLUGGISH_WAIT_TIME)

      fill_in "Name", with: "Name that is long and does end in year 2016"
      click_button "Update Competition"

      expect(page).to have_current_path(edit_competition_path("NewId2016"), wait: SLUGGISH_WAIT_TIME)

      c = Competition.find("NewId2016")
      expect(c).not_to be_nil
      expect(c.name).to eq "Name that is long and does end in year 2016"
    end

    scenario "custom approved ID not changing on confirmed competitions from organizer view" do
      competition = create(:competition, :confirmed, id: "OldId2016", name: "competition name short 2016")
      visit edit_competition_path(competition)
      click_button "Update Competition"

      # Force Capybara to wait until the page finishes updating
      expect(page).to have_current_path(edit_competition_path("OldId2016"), wait: SLUGGISH_WAIT_TIME)

      c = Competition.find("OldId2016")
      expect(c).not_to be_nil
    end

    scenario "can change id of short name from admin view" do
      competition = create(:competition, :with_delegate, :with_competitor_limit, id: "OldId2016", name: "competition name short 2016")
      visit competition_admin_edit_path(competition)
      fill_in "ID", with: "NewId2016"
      click_button "Update Competition"

      # Force Capybara to wait until the page finishes updating
      expect(page).to have_current_path(competition_admin_edit_path("NewId2016"), wait: SLUGGISH_WAIT_TIME)

      c = Competition.find("NewId2016")
      expect(c).not_to be_nil
    end

    scenario "cannot change id of short name from organizer view" do
      competition = create(:competition, :with_delegate, id: "OldId2016", name: "competition name short 2016")
      visit edit_competition_path(competition)

      expect { fill_in "ID", with: "NewId2016" }.to raise_error(Capybara::ElementNotFound)
    end

    scenario "change guest entry fee to zero" do
      competition = create(:competition, :with_delegate, id: "OldId2016", guests_entry_fee_lowest_denomination: 0)
      visit edit_competition_path(competition)

      expect(page).to have_text("Display message for free guest entry")
    end

    scenario "change guest entry fee to non-zero", :js do
      competition = create(:competition, :with_delegate, id: "OldId2016", guests_entry_fee_lowest_denomination: 666)
      visit edit_competition_path(competition)

      expect(page).to have_text(competition.name)
      expect(page).to have_no_text("Display message for free guest entry")
    end

    scenario "select free guest entry status" do
      competition = create(:competition, :with_delegate, id: "OldId2016", guest_entry_status: Competition.guest_entry_statuses['free'])
      visit competition_path(competition)
      find('div', id: 'show_registration_requirements').click_link('here')

      expect(page).to have_text("Any spectator can attend for free.")
    end

    scenario "select restricted guest entry status" do
      competition = create(:competition, :with_delegate, id: "OldId2016", guest_entry_status: Competition.guest_entry_statuses['restricted'])
      visit competition_path(competition)
      find('div', id: 'show_registration_requirements').click_link('here')

      expect(page).to have_text("Spectators are only permitted as companions of competitors.")
    end
  end

  context "when signed in as delegate" do
    let!(:delegate) { create(:delegate) }
    let(:cloned_delegate) { create(:delegate) }
    let(:competition_to_clone) { create(:competition, :visible, city_name: 'Melbourne, Victoria', country_id: "Australia", delegates: [cloned_delegate]) }

    let(:threes) { Event.find("333") }
    let(:fours) { Event.find("444") }

    before :each do
      sign_in delegate
    end

    scenario 'create competition', :js do
      visit new_competition_path

      fill_in "Name", with: "New Comp 2015"
      region_input.fill_in with: "United States"
      fill_in "Start date", with: '08/11/2015'
      fill_in "End date", with: '08/11/2015'
      wca_registration_checkbox.click
      fill_in "Maximum number of competitors", with: '123'
      fill_in "The reason for the competitor limit", with: 'Because it is required'
      click_button "Create Competition"

      # Force Capybara to wait until the page finishes updating
      expect(page).to have_current_path(edit_competition_path("NewComp2015"), wait: SLUGGISH_WAIT_TIME)

      expect(Competition.all.length).to eq 1
      new_competition = Competition.find("NewComp2015")
      expect(new_competition.name).to eq "New Comp 2015"
      expect(new_competition.delegates).to eq [delegate]
    end

    scenario "id and cell_name changes for short comp name", :js do
      competition = create(:competition, delegates: [delegate], id: "competitionnameshort2016", name: "competition name short 2016")
      visit edit_competition_path(competition)
      fill_in "Name", with: "New Id 2016"

      click_button "Update Competition"

      # Force Capybara to wait until the page finishes updating
      expect(page).to have_current_path(edit_competition_path("NewId2016"), wait: SLUGGISH_WAIT_TIME)

      c = Competition.find("NewId2016")
      expect(c).not_to be_nil
      expect(c.cell_name).to eq "New Id 2016"
    end

    scenario "cannot submit a competition where registration has already closed" do
      comp = create(:competition, :not_visible, :registration_closed, delegates: [delegate])
      visit edit_competition_path(comp)
      # patch :update, params: { id: comp, competition: { name: comp.name }, commit: "Confirm" }
      click_button "Confirm"
      expect(comp.reload.confirmed?).to be false
    end

    scenario 'clone competition', :js do
      visit clone_competition_path(competition_to_clone)

      fill_in "Name", with: "New Comp 2015"

      expect(page).to have_button('Create Competition')
      click_button "Create Competition"

      # Force Capybara to wait until the page finishes updating
      expect(page).to have_current_path(edit_competition_path("NewComp2015"), wait: SLUGGISH_WAIT_TIME)

      expect(Competition.all.length).to eq 2
      new_competition = Competition.find("NewComp2015")
      expect(new_competition.name).to eq "New Comp 2015"
      expect(new_competition.delegates).to eq [delegate, cloned_delegate]
      expect(new_competition.venue).to eq competition_to_clone.venue
      expect(new_competition.show_at_all).to be false
      expect(new_competition.confirmed?).to be false
      expect(new_competition.city_name).to eq 'Melbourne, Victoria'
    end

    feature "edit" do
      let(:comp_with_fours) { create(:competition, events: [fours], delegates: [delegate]) }

      scenario 'can edit registration open datetime', :js do
        visit edit_competition_path(comp_with_fours)

        expect(page).to have_field("registration-openingDateTime", type: 'text', disabled: false)
        expect(page).to have_field("registration-closingDateTime", type: 'text', disabled: false)

        wca_registration_checkbox.click

        expect(page).to have_field("registration-openingDateTime", type: 'text', disabled: false)
        expect(page).to have_field("registration-closingDateTime", type: 'text', disabled: false)
      end
    end
  end
end
