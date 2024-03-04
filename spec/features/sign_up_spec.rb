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

    it "remembers that they have competed before on validation error" do
      visit "/users/sign_up"
      click_on "I have competed in a WCA competition."
      click_button "Sign up"

      expect(page).to have_selector('#have-competed', visible: :visible)
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
