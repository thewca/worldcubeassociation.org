require "rails_helper"

RSpec.feature "Claim WCA ID" do
  let!(:user) { FactoryGirl.create(:user) }
  let!(:person) { FactoryGirl.create(:person_who_has_competed_once, year: 1988, month: 02, day: 03) }
  let!(:person_without_dob) { FactoryGirl.create :person, year: 0, month: 0, day: 0 }

  context 'when signed in as user without wca id', js: true do
    before :each do
      sign_in user
    end

    it 'can claim WCA ID' do
      visit "/profile/claim_wca_id"

      # They have not selected a valid WCA ID yet, so don't show the birthdate verification
      # field.
      expect(page.find("div.user_dob_verification", visible: false).visible?).to eq false

      selectize_input = page.find("div.user_unconfirmed_wca_id .selectize-control input")
      selectize_input.native.send_key(person.wca_id)
      # Wait for selectize popup to appear.
      expect(page).to have_selector("div.selectize-dropdown", visible: true)
      # Select item with selectize.
      page.find("div.user_unconfirmed_wca_id input").native.send_key(:return)

      # Wait for select delegate area to load via ajax.
      expect(page.find("#select-nearby-delegate-area")).to have_content "In order to assign you your WCA ID"

      # Now that they've selected a valid WCA ID, make sure the birthdate
      # verification field is visible.
      expect(page.find("div.user_dob_verification", visible: true).visible?).to eq true

      delegate = person.competitions.first.delegates.first
      choose("user_delegate_id_to_handle_wca_id_claim_#{delegate.id}")

      # First, intentionally fill in the incorrect birthdate,
      # to test out our validations.
      fill_in "Birthdate", with: "1900-01-01"
      click_button "Claim WCA ID"

      # Make sure we inform the user of the incorrect birthdate they just
      # entered.
      expect(page.find(".alert.alert-danger")).to have_content("Birthdate incorrect")
      # Now enter the correct birthdate and submit the form!
      fill_in "Birthdate", with: "1988-02-03"
      click_button "Claim WCA ID"

      user.reload
      expect(user.unconfirmed_wca_id).to eq person.id
      expect(user.delegate_to_handle_wca_id_claim).to eq delegate
    end

    it 'tells you to contact Results team if your WCA ID does not have a birthdate' do
      visit "/profile/claim_wca_id"

      selectize_input = page.find("div.user_unconfirmed_wca_id .selectize-control input")
      selectize_input.native.send_key(person_without_dob.wca_id)
      # Wait for selectize popup to appear.
      expect(page).to have_selector("div.selectize-dropdown", visible: true)
      # Select item with selectize.
      page.find("div.user_unconfirmed_wca_id input").native.send_key(:return)

      expect(page.find("#select-nearby-delegate-area")).to have_content "WCA ID #{person_without_dob.wca_id} does not have a birthdate assigned. Please contact the Results team to fix this."
    end
  end
end
