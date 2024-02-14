# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Sign up" do
  let!(:person) { FactoryBot.create(:person_who_has_competed_once, dob: '1988-02-03') }
  let!(:custom_delegate) { FactoryBot.create(:delegate) }

  before :each do
    # The cookie banner just gets in the way of these tests, and is already
    # tested elsewhere. Set a cookie that prevents the cookie banner from
    # appearing.
    page.driver.set_cookie('cookie_eu_consented', 'true')
  end

  context 'when signing up as a returning competitor', js: true do
    it 'disables sign up button until the user selects "have competed"' do
      visit "/users/sign_up"

      expect(page).to have_selector('#have-competed', visible: :hidden)
      expect(page).to have_button("Sign up", disabled: true)
      click_on "I have competed in a WCA competition."
      expect(page).to have_selector('#have-competed', visible: :visible)
      expect(page).to have_button("Sign up")
    end

    it 'disables sign up button after opening and then closing "have competed"' do
      visit "/users/sign_up"

      expect(page).to have_selector('#have-competed', visible: :hidden)
      expect(page).to have_button("Sign up", disabled: true)
      click_on "I have competed in a WCA competition."
      expect(page).to have_selector('#have-competed', visible: :visible)
      expect(page).to have_button("Sign up", disabled: false)
      click_on "I have competed in a WCA competition."
      expect(page).to have_selector('#have-competed', visible: :hidden)
      expect(page).to have_button("Sign up", disabled: true)
    end

    it 'finds people by name' do
      visit "/users/sign_up"

      fill_in "Email", with: "jack@example.com"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"
      click_on "I have competed in a WCA competition."

      # They have not selected a valid WCA ID yet, so don't show the birthdate verification
      # field.
      expect(page).to have_selector("div.user_dob_verification", visible: :hidden)

      fill_in_selectize "WCA ID", with: person.wca_id

      # Wait for select delegate area to load via ajax.
      expect(page.find("#select-nearby-delegate-area")).to have_content "In order to assign you your WCA ID"

      # Now that they've selected a valid WCA ID, make sure the birthdate
      # verification field is visible.
      expect(page).to have_selector("div.user_dob_verification", visible: :visible)

      delegate = person.competitions.first.delegates.first
      choose("user_delegate_id_to_handle_wca_id_claim_#{delegate.id}")

      # First, intentionally fill in the incorrect birthdate,
      # to test out our validations.
      fill_in "Birthdate", with: "1900-01-01"
      click_button "Sign up"

      # Make sure we inform the user of the incorrect birthdate they just
      # entered.
      expect(page.find(".alert.alert-danger")).to have_content("Birthdate does not match our database.")
      # Now enter the correct birthdate and submit the form!
      fill_in "Birthdate", with: "1988-02-03"
      # We also have to re-fill in the password and password confirmation
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"
      click_button "Sign up"

      u = User.find_by_email!("jack@example.com")
      expect(u.name).to eq person.name
      expect(u.gender).to eq person.gender
      expect(u.country_iso2).to eq person.country_iso2

      expect(u.unconfirmed_wca_id).to eq person.wca_id
      expect(u.delegate_id_to_handle_wca_id_claim).to eq delegate.id

      expect(WcaIdClaimMailer).to receive(:notify_delegate_of_wca_id_claim).with(u).and_call_original
      expect do
        visit "/users/confirmation?confirmation_token=#{u.confirmation_token}"
      end.to change { enqueued_jobs.size }.by(1)
    end

    it "remembers that they have competed before on validation error" do
      visit "/users/sign_up"
      click_on "I have competed in a WCA competition."
      click_button "Sign up"

      expect(page).to have_selector('#have-competed', visible: :visible)
    end

    it "remembers their selected wca id on validation error" do
      visit "/users/sign_up"
      click_on "I have competed in a WCA competition."
      # They have not selected a valid WCA ID yet, so don't show the birthdate verification
      # field.
      expect(page).to have_selector("div.user_dob_verification", visible: :hidden)

      fill_in_selectize "WCA ID", with: person.wca_id

      # Wait for select delegate area to load via ajax.
      expect(page.find("#select-nearby-delegate-area")).to have_content "In order to assign you your WCA ID"

      # Now that they've selected a valid WCA ID, make sure the birthdate
      # verification field is visible.
      expect(page).to have_selector("div.user_dob_verification", visible: :visible)

      # Submit the form without selecting a delegate.
      click_button "Sign up"

      expect(page).to have_selector('#have-competed', visible: :visible)
      expect(page).to have_selector("div.user_dob_verification", visible: :visible)
    end

    it "remembers their selected wca id and custom delegate on validation error" do
      visit "/users/sign_up"
      click_on "I have competed in a WCA competition."
      # They have not selected a valid WCA ID yet, so don't show the birthdate verification
      # field.
      expect(page).to have_selector("div.user_dob_verification", visible: :hidden)

      fill_in_selectize "WCA ID", with: person.wca_id

      # Wait for select delegate area to load via ajax.
      expect(page.find("#select-nearby-delegate-area")).to have_content "In order to assign you your WCA ID"

      # Now that they've selected a valid WCA ID, make sure the birthdate
      # verification field is visible.
      expect(page).to have_selector("div.user_dob_verification", visible: :visible)

      # Select a custom delegate.
      selectize = page.find("#nearby-delegate-search + div.selectize-control")
      fill_in_selectize selectize, with: custom_delegate.wca_id

      click_button "Sign up"

      # Verify that the custom delegate is still selected.
      selectize_items = selectize.all("div.selectize-control .items")
      expect(selectize_items.length).to eq 1
      expect(selectize_items[0].find('.name').text).to eq custom_delegate.name

      expect(page).to have_selector('#have-competed', visible: :visible)
      expect(page).to have_selector("div.user_dob_verification", visible: :visible)
    end
  end

  context 'when signing up as a first time competitor', js: true do
    it 'can sign up' do
      visit "/users/sign_up"

      fill_in "Email", with: "jack@example.com"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"

      # Check that we disable the sign up button until the user selects
      # "never competed".
      expect(page).to have_selector('#never-competed', visible: :hidden)
      expect(page).to have_button("Sign up", disabled: true)
      click_on "I have never competed in a WCA competition."
      expect(page).to have_selector('#never-competed', visible: :visible)
      expect(page).to have_button("Sign up")

      fill_in "Full name", with: "Jack Johnson"
      fill_in "Birthdate", with: "1975-05-18"
      select "Male", from: "Gender"
      select "United States", from: "Representing"

      click_button "Sign up"

      expect(page).to have_content "A message with a confirmation link has been sent to your email address."

      u = User.find_by_email!("jack@example.com")
      expect(u.gender).to eq "m"
    end

    it 'disables sign up button after opening and then closing "never competed"' do
      visit "/users/sign_up"

      expect(page).to have_selector('#never-competed', visible: :hidden)
      expect(page).to have_button("Sign up", disabled: true)
      click_on "I have never competed in a WCA competition."
      expect(page).to have_selector('#never-competed', visible: :visible)
      expect(page).to have_button("Sign up", disabled: false)
      click_on "I have never competed in a WCA competition."
      expect(page).to have_selector('#never-competed', visible: :hidden)
      expect(page).to have_button("Sign up", disabled: true)
    end

    it "remembers that they have not competed before on validation error" do
      visit "/users/sign_up"
      click_on "I have never competed in a WCA competition."
      click_button "Sign up"

      expect(page).to have_selector('#never-competed', visible: :visible)
    end
  end

  context "changing between noobie and have competed", js: true do
    it "disables previous competitor fields when signing up as a noobie" do
      visit "/users/sign_up"

      fill_in "Email", with: "jack@example.com"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"

      click_on "I have competed in a WCA competition."
      fill_in_selectize "WCA ID", with: person.wca_id

      # Wait for select delegate area to load via ajax.
      expect(page.find("#select-nearby-delegate-area")).to have_content "In order to assign you your WCA ID"
      # Now that they've selected a valid WCA ID, make sure the birthdate
      # verification field is visible.
      expect(page).to have_selector("div.user_dob_verification", visible: :visible)
      delegate = person.competitions.first.delegates.first
      choose("user_delegate_id_to_handle_wca_id_claim_#{delegate.id}")
      # Now enter the wrong birthdate.
      fill_in "Birthdate", with: "1900-02-03"

      # We just filled some invalid information as if we were a returning competitor, but
      # now change our minds and fill out the form as if we're a noobie. We should only show
      # an error message about the full name.
      click_on "I have never competed in a WCA competition."
      click_button "Sign up"
      expect(page).to have_selector(".alert.alert-danger li", count: 1)
      expect(page.find(".user_name span.help-block")).to have_content "can't be blank"

      fill_in "Full name", with: "Jackson John"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"
      click_button "Sign up"
      u = User.find_by_email!("jack@example.com")
      expect(u.name).to eq "Jackson John"
    end

    it "disables noobie fields when signing up as a previous competitor" do
      visit "/users/sign_up"

      fill_in "Email", with: "jack@example.com"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"

      click_on "I have competed in a WCA competition."
      click_button "Sign up"
      expect(page).to have_selector(".alert.alert-danger li", count: 3)
      expect(page.find(".alert.alert-danger")).to have_content "Delegate id to handle wca id claim required"
      expect(page.find(".alert.alert-danger")).to have_content "Unconfirmed WCA ID required"
      expect(page.find(".alert.alert-danger")).to have_content "Unconfirmed WCA ID is invalid"
    end
  end

  context "changing have competed and noobie", js: true do
    it "does not leak birthdate information" do
      visit "/users/sign_up"

      fill_in "Email", with: "jack@example.com"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"

      click_on "I have competed in a WCA competition."
      fill_in_selectize "WCA ID", with: person.wca_id

      click_button "Sign up"
      click_on "I have never competed in a WCA competition."
      expect(page.find("#user_dob", visible: :hidden).value).to eq ""
    end

    it "does not allow both panels to be open after failed submission" do
      visit "/users/sign_up"

      fill_in "Email", with: "jack@example.com"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"

      click_on "I have competed in a WCA competition."

      click_button "Sign up"
      page.find('#have-competed.collapse.in') # ensure page loads completely

      expect(page).to have_selector('#have-competed', visible: :visible)
      expect(page).to have_selector('#never-competed', visible: :hidden)
      click_on "I have never competed in a WCA competition."
      expect(page).to have_selector('#have-competed', visible: :hidden)
      expect(page).to have_selector('#never-competed', visible: :visible)
      click_on "I have competed in a WCA competition."
      expect(page).to have_selector('#have-competed', visible: :visible)
      expect(page).to have_selector('#never-competed', visible: :hidden)
    end
  end

  context "when signing up as a non-english speaker", js: true do
    it "stores the user's preferred locale" do
      page.driver.headers = { 'Accept-Language' => 'es' }
      visit "/users/sign_up"

      fill_in "user[email]", with: "jack@example.com"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"
      click_on "Nunca he competido en competiciones de la WCA."
      fill_in "user[name]", with: "Jack Johnson"

      click_button "Registrarse"

      user = User.find_by_email!("jack@example.com")
      expect(user.preferred_locale).to eq "es"
    end
  end
end
