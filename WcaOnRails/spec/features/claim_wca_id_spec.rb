require "rails_helper"

RSpec.feature "Claim WCA ID" do
  let!(:user) { FactoryGirl.create(:user) }
  let!(:person) { FactoryGirl.create(:person_who_has_competed_once, year: 1988, month: 02, day: 03) }

  context 'when signed in as user without wca id', js: true do
    before :each do
      visit "/users/sign_in"
      fill_in "Email or WCA ID", with: user.email
      fill_in "Password", with: user.password
      click_button "Sign in"
    end

    it 'can claim WCA ID' do
      visit "/profile/claim_wca_id"

      # They have not selected a valid WCA ID yet, so don't show the birthdate verification
      # field.
      expect(page.find("div.user_dob_verification", visible: false).visible?).to eq false

      selectize_input = page.find("div.user_unconfirmed_wca_id .selectize-control input")
      selectize_input.native.send_key(person.id)

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

      fill_in "Birthdate", with: "1988-02-03"

      click_button "Claim WCA ID"

      user.reload
      expect(user.unconfirmed_wca_id).to eq person.id
      expect(user.delegate_to_handle_wca_id_claim).to eq delegate
    end
  end
end
