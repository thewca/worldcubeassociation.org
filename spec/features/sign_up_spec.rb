# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Sign up" do
  let!(:person) { create(:person_who_has_competed_once, dob: '1988-02-03') }
  let!(:custom_delegate) { create(:delegate) }

  before :each do
    # The cookie banner just gets in the way of these tests, and is already
    # tested elsewhere. Set a cookie that prevents the cookie banner from
    # appearing.
    default_domain = Capybara.app_host || Capybara.server_host
    cookie_eu_consented = { name: 'cookie_eu_consented', value: 'true', domain: default_domain, path: '/' }
    page.driver.with_playwright_page { it.context.add_cookies([cookie_eu_consented]) }
  end

  context 'can sign up', :js do
    it 'when signing up as a returning competitor' do
      visit "/users/sign_up"

      fill_in "Full name", with: "Jack Johnson"
      fill_in("Birthdate", with: "1975-05-18").send_keys(:escape)
      select "Male", from: "Gender"
      select "United States", from: "Representing"
      fill_in "Email", with: "jack@example.com"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"
      choose "should_claim_wca_id_true"

      expect(page).to have_button("Sign up")

      click_button "Sign up"

      expect(page).to have_content "A message with a confirmation link has been sent to your email address."

      u = User.find_by!(email: "jack@example.com")
      expect(u.gender).to eq "m"
    end

    it 'when signing up as a first time competitor' do
      visit "/users/sign_up"

      fill_in "Full name", with: "Jack Johnson"
      fill_in("Birthdate", with: "1975-05-18").send_keys(:escape)
      select "Male", from: "Gender"
      select "United States", from: "Representing"
      fill_in "Email", with: "jack@example.com"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"
      choose "should_claim_wca_id_false"

      expect(page).to have_button("Sign up")

      click_button "Sign up"

      expect(page).to have_content "A message with a confirmation link has been sent to your email address."

      u = User.find_by!(email: "jack@example.com")
      expect(u.gender).to eq "m"
    end
  end

  context "when signing up as a non-english speaker", :js do
    it "stores the user's preferred locale" do
      page.driver.with_playwright_page { it.context.set_extra_http_headers({ 'Accept-Language' => 'it' }) }
      visit "/users/sign_up"

      fill_in "Nome completo", with: "Jack Johnson"
      fill_in("Data di nascita", with: "1975-05-18").send_keys(:escape)
      select "Maschio", from: "Sesso"
      select "Antigua e Barbuda", from: "Cittadinanza"
      fill_in "Email", with: "jack@example.com"
      fill_in "user[password]", with: "wca"
      fill_in "user[password_confirmation]", with: "wca"
      choose "should_claim_wca_id_false"

      click_button "Registrati"

      user = User.find_by!(email: "jack@example.com")
      expect(user.preferred_locale).to eq "it"
    end
  end
end
