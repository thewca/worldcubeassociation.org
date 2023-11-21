# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Claim WCA ID" do
  let!(:user) { FactoryBot.create(:user) }
  let!(:person) { FactoryBot.create(:person_who_has_competed_once, dob: '1988-02-03') }
  let!(:person_without_dob) { FactoryBot.create :person, :skip_validation, :missing_dob }

  context 'when signed in as user without wca id', js: true do
    before :each do
      sign_in user
    end

    it 'can claim WCA ID', skip: "because it is unstable in GitHub CI" do
      visit "/profile/claim_wca_id"

      # They have not selected a valid WCA ID yet, so don't show the birthdate verification
      # field.
      expect(page.find("div.user_dob_verification", visible: false).visible?).to eq false

      # Fill in WCA ID.
      fill_in_selectize "WCA ID", with: person.wca_id

      # Wait for select delegate area to load via ajax.
      expect(page.find("#select-nearby-delegate-area")).to have_content "In order to assign you your WCA ID"

      # Now that they've selected a valid WCA ID, make sure the birthdate
      # verification field is visible.
      expect(page.find("div.user_dob_verification", visible: true).visible?).to eq true

      delegate = person.competitions.first.delegates.first
      choose("user_delegate_id_to_handle_wca_id_claim_#{delegate.id}")

      # First, intentionally fill in the incorrect birthdate,
      # to test out our validations.
      fill_in("Birthdate", with: "1900-01-01").send_keys(:enter)
      click_button "Claim WCA ID"

      # Make sure we inform the user of the incorrect birthdate they just
      # entered.
      expect(person.reload.incorrect_wca_id_claim_count).to eq 1
      expect(page.find(".alert.alert-danger")).to have_content("Birthdate does not match our database.")
      # Now enter the correct birthdate and submit the form!
      fill_in("Birthdate", with: "1988-02-03").send_keys(:enter)
      click_button "Claim WCA ID"

      user.reload
      expect(person.reload.incorrect_wca_id_claim_count).to eq 1
      expect(user.unconfirmed_wca_id).to eq person.wca_id
      expect(user.delegate_to_handle_wca_id_claim).to eq delegate
    end

    it 'tells you to contact Results team if your WCA ID does not have a birthdate', skip: "because it is unstable in GitHub CI" do
      visit "/profile/claim_wca_id"

      fill_in_selectize "WCA ID", with: person_without_dob.wca_id

      expect(page.find("#select-nearby-delegate-area")).to have_content "WCA ID #{person_without_dob.wca_id} does not have a birthdate assigned. Please contact with WCA Results Team using this dedicated form."
    end

    it 'tells you to contact Results team if you WCA ID has been incorrectly claimed too many times', skip: "because it is unstable in GitHub CI" do
      visit "/profile/claim_wca_id"

      # Fill in WCA ID.
      fill_in_selectize "WCA ID", with: person.wca_id

      # Wait for select delegate area to load via ajax, then fill it in.
      expect(page.find("#select-nearby-delegate-area")).to have_content "In order to assign you your WCA ID"
      # Select a delegate.
      delegate = person.competitions.first.delegates.first
      choose("user_delegate_id_to_handle_wca_id_claim_#{delegate.id}")

      5.times do |i|
        # First, intentionally fill in the incorrect birthdate,
        # to test out our validations.
        fill_in("Birthdate", with: "1900-01-01").send_keys(:enter)
        click_button "Claim WCA ID"

        # Make sure we inform the user of the incorrect birthdate they just
        # entered.
        expect(page.find(".alert.alert-danger")).to have_content("Birthdate does not match our database.")
        expect(person.reload.incorrect_wca_id_claim_count).to eq(i + 1)
      end

      # Now enter the correct birthdate and submit the form!
      fill_in("Birthdate", with: "1988-02-03").send_keys(:enter)
      click_button "Claim WCA ID"

      # Based on WRT request here: https://github.com/thewca/worldcubeassociation.org/pull/3666#discussion_r253315031,
      # the expected message for this is users.errors.wca_id_no_birthdate_html
      expect(page.find(".alert.alert-danger")).to have_content("We do not have a birthdate recorded for this WCA ID. Please contact the WCA Results Team")
      user.reload
      expect(user.unconfirmed_wca_id).to eq nil
      expect(user.delegate_to_handle_wca_id_claim).to eq nil
    end
  end
end
