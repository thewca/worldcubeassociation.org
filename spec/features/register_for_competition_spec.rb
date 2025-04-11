# frozen_string_literal: true

require "rails_helper"

def reg_requirements_checkbox
  all(:css, "label[for='regRequirementsCheckbox']").last
end

def find_modal(&)
  all(:css, '.modal.visible', &).last
end

def within_modal(&)
  within(find_modal(&))
end

RSpec.feature "Registering for a competition", :js do
  let!(:user) { create :user }
  let!(:delegate) { create :delegate }
  let(:competition) { create :competition, :registration_open, :visible, :editable_registrations, delegates: [delegate] }

  context "signed in as user" do
    before :each do
      sign_in user
    end

    scenario "User registers for a competition normally" do
      visit competition_register_path(competition)
      reg_requirements_checkbox.click
      click_button "Continue to next Step"
      click_button "checkbox-333"
      click_button "Register!"
      expect(page).to have_text("Your registration is processing...")
      perform_enqueued_jobs
      expect(page).to have_text("Your registration is pending approval by the organizers.")
      registration = competition.registrations.find_by(user_id: user.id)
      expect(registration).not_to be_nil
    end

    scenario "User registers for a competition with invalid information" do
      visit competition_register_path(competition)

      # First step: Accept registration requirements
      reg_requirements_checkbox.click
      click_button "Continue to next Step"

      # Leave Events selection empty by simply not interaction with it at all.

      click_button "Register!"

      # If registration works, the valid data will make the frontend skip to the next step
      #   which in this case (because there's no payment provider connected) would be to display
      #   the "your registration is processing" information. However, we expect that the registration is invalid,
      #   so the registration should be stuck at the "Register!" screen.
      expect(page).to have_text("Register!")

      # This error text roughly reads "must register for at least one event",
      #   which is what we expect because we never interacted with the events picker in the first place.
      expect(page).to have_text(I18n.t('registrations.errors.must_register'))

      # Expect there to be no registration. Note that this assumption doesn't care
      #   _why_ there is no registration found. It's enough to know that the registration wasn't successful.
      perform_enqueued_jobs

      registration = competition.registrations.find_by(user_id: user.id)
      expect(registration).to be_nil
    end

    scenario "User with preferred events goes to register page" do
      user.update_attribute :preferred_events, Event.where(id: %w(333 444 555))
      competition.update_attribute :events, Event.where(id: %w(444 555 666))

      visit competition_register_path(competition)
      reg_requirements_checkbox.click
      click_button "Continue to next Step"
      expect(find("#checkbox-444")).to match_selector(".active")
      expect(find("#checkbox-555")).to match_selector(".active")
      expect(find("#checkbox-666")).not_to match_selector(".active")
    end

    context "editing registration" do
      let!(:registration) { create(:registration, user: user, competition: competition, guests: 0) }

      scenario "Users changes number of guests" do
        expect(registration.guests).to eq 0

        visit competition_register_path(competition)
        click_button "Update Registration"

        fill_in "guest-dropdown", with: "2"
        click_button "Update Registration"

        within_modal do
          click_button "Yes"
        end

        expect(page).to have_text("Updated registration")
        expect(registration.reload.guests).to eq 2
      end

      scenario "Users sets guests to an invalid number" do
        visit competition_register_path(competition)
        click_button "Update Registration"

        fill_in "guest-dropdown", with: "123"
        click_button "Update Registration"

        # The browser shows a validation for numeric inputs client-side.
        #   See the scenario "User registers for a competition with invalid guest info" for details.
        expect(page).to have_text("Update Registration")
      end
    end
  end

  context "not signed in" do
    scenario "following sign in link on register page should redirect back to register page", js: false do
      visit competition_register_path(competition)

      within('#competition-data') do
        click_link("Sign in")
      end

      fill_in "Email or WCA ID", with: user.email
      fill_in "Password", with: user.password
      click_button "Sign in"

      expect(current_url).to eq competition_register_url(competition)
    end
  end

  context "signed in as delegate" do
    let!(:registration) { create(:registration, user: user, competition: competition) }
    let(:delegate_registration) { create(:registration, :accepted, user: delegate, competition: competition) }

    before :each do
      sign_in delegate
    end

    scenario "updating registration" do
      visit edit_registration_v2_path(competition_id: competition.id, user_id: user.id)

      fill_in "guest-dropdown", with: 1
      click_button "Update Registration"

      within_modal do
        click_button "Yes"
      end

      expect(page).to have_text("Updated registration")
      expect(registration.reload.guests).to eq 1
    end

    scenario "updating his own registration" do
      # The expected '10' at the beginning here is a default value in the factory
      expect(delegate_registration.guests).to eq 10

      visit competition_register_path(competition)

      expect(page).to have_text("Your registration has been accepted.")
      click_button "Update Registration"

      fill_in "guest-dropdown", with: "2"
      click_button "Update Registration"

      within_modal do
        click_button "Yes"
      end

      expect(page).to have_text("Your registration has been accepted.")
      expect(delegate_registration.reload.guests).to eq 2
    end

    scenario "deleting registration" do
      visit edit_registration_v2_path(competition_id: competition.id, user_id: user.id)

      # SemUI render the actual radio inputs as `hidden` in CSS, so we have to take a detour via the label
      find('label[for="radio-status-cancelled"]').click
      click_button "Update Registration"

      within_modal do
        click_button "Yes"
      end

      expect(page).to have_text("Updated registration")
      expect(Registration.find_by(id: registration.id).cancelled?).to be true
    end
  end
end
