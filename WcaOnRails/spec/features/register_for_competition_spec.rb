# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Registering for a competition" do
  let!(:user) { FactoryBot.create :user }
  let!(:delegate) { FactoryBot.create :delegate }
  let(:competition) { FactoryBot.create :competition, :registration_open, delegates: [delegate], showAtAll: true }

  context "signed in as user" do
    before :each do
      sign_in user
    end

    scenario "User registers for a competition" do
      visit competition_register_path(competition)
      check "registration_competition_events_333"
      click_button "Register!"
      expect(page).to have_text("Registration submitted - make sure to follow payment instructions to avoid disappointment!")
      registration = competition.registrations.find_by_user_id(user.id)
      expect(registration).not_to eq nil
    end

    scenario "User registers for a competition with invalid guest info" do
      visit competition_register_path(competition)
      fill_in "Guests", with: "-1"
      click_button "Register!"
      expect(page).to have_text("Guests must be greater than or equal to 0")
      expect(page).to have_text("must register for at least one event")
      registration = competition.registrations.find_by_user_id(user.id)
      expect(registration).to eq nil
    end

    scenario "User with preferred events goes to register page" do
      user.update_attribute :preferred_events, Event.where(id: %w(333 444 555))
      competition.update_attribute :events, Event.where(id: %w(444 555 666))

      visit competition_register_path(competition)
      expect(find("#registration_competition_events_444")).to be_checked
      expect(find("#registration_competition_events_555")).to be_checked
      expect(find("#registration_competition_events_666")).to_not be_checked
    end

    context "editing registration" do
      let!(:registration) { FactoryBot.create(:registration, user: user, competition: competition, guests: 0) }

      scenario "Users changes number of guests" do
        expect(registration.guests).to eq 0

        visit competition_register_path(competition)
        fill_in "Guests", with: "2"
        click_button "Update Registration"

        expect(page).to have_text("Your registration is pending.")
        expect(registration.reload.guests).to eq 2
      end

      scenario "Users sets guests to a non number" do
        visit competition_register_path(competition)
        fill_in "Guests", with: "this is not a number"
        click_button "Update Registration"

        expect(page).to have_text("Your registration is pending.")
      end
    end
  end

  context "not signed in" do
    scenario "following sign in link on register page should redirect back to register page" do
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
    let(:registration) { FactoryBot.create(:registration, user: user, competition: competition) }
    let(:delegate_registration) { FactoryBot.create(:registration, :accepted, user: delegate, competition: competition) }
    before :each do
      sign_in delegate
    end

    scenario "updating registration" do
      visit edit_registration_path(registration)
      fill_in "Guests", with: 1
      click_button "Update Registration"
      expect(registration.reload.guests).to eq 1
    end

    scenario "updating his own registration" do
      expect(delegate_registration.guests).to eq 10

      visit competition_register_path(competition)

      expect(page).to have_text("Your registration has been accepted!")
      fill_in "Guests", with: "2"
      click_button "Update Registration"

      expect(page).to have_text("Your registration has been accepted!")
      expect(delegate_registration.reload.guests).to eq 2
    end

    scenario "deleting registration" do
      visit edit_registration_path(registration)
      choose "Deleted"
      click_button "Update Registration"
      expect(Registration.find_by_id(registration.id).deleted?).to eq true
    end
  end
end
