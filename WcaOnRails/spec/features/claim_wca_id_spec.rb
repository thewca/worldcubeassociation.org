require "rails_helper"

RSpec.feature "Claim WCA ID" do
  let!(:user) { FactoryGirl.create(:user) }
  let!(:person) { FactoryGirl.create(:person_who_has_competed_once) }

  context 'when signed in as user without wca id', js: true do
    before :each do
      visit "/users/sign_in"
      fill_in "Email or WCA ID", with: user.email
      fill_in "Password", with: user.password
      click_button "Sign in"
    end

    it 'can claim WCA ID' do
      visit "/profile/claim_wca_id"

      selectize_input = page.find("div.user_unconfirmed_wca_id .selectize-control input")
      selectize_input.native.send_key(person.id)

      # Wait for selectize popup to appear.
      expect(page).to have_selector("div.selectize-dropdown", visible: true)

      # Select item with selectize.
      page.find("div.user_unconfirmed_wca_id input").native.send_key(:return)

      # Wait for select delegate area to load via ajax.
      expect(page.find("#select-nearby-delegate-area")).to have_content "In order to assign you your WCA ID"

      delegate = person.competitions.first.delegates.first
      choose("user_delegate_id_to_handle_wca_id_claim_#{delegate.id}")

      click_button "Claim WCA ID"

      user.reload
      expect(user.unconfirmed_wca_id).to eq person.id
      expect(user.delegate_to_handle_wca_id_claim).to eq delegate
    end
  end
end
