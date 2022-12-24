# frozen_string_literal: true

require "rails_helper"

RSpec.feature "cookie law" do
  context "not signed in" do
    scenario "remembers acknowledgement", js: true do
      # Visit the homepage and accept the cookie warning.
      visit_homepage_and_wait_for_load
      acknowledge_cookie_banner

      # Visit the homepage a second time. We should not see the cookie banner
      # (because we just acknowledged it!)
      visit_homepage_and_wait_for_load
      expect(page).not_to have_selector(CookieBannerHelper::ACKNOWLEDGE_SELECTOR)

      # Clear cookies and visit the homepage again. The cookie banner should
      # show back up.
      page.driver.clear_cookies
      visit_homepage_and_wait_for_load
      expect(page).to have_selector(CookieBannerHelper::ACKNOWLEDGE_SELECTOR)
    end
  end

  context "signed in" do
    let!(:admin) { FactoryBot.create(:admin, cookies_acknowledged: false) }
    background do
      sign_in admin
    end

    scenario "remembers acknowledgement without cookies", js: true do
      visit_homepage_and_wait_for_load
      acknowledge_cookie_banner

      # Clear cookies. This logs us out and clears the acknowledgement cookie.
      # The banner should come back.
      page.driver.clear_cookies
      visit_homepage_and_wait_for_load
      expect(page).to have_selector(CookieBannerHelper::ACKNOWLEDGE_SELECTOR)

      # Sign back in. The database should remember that we already acknowledged
      # cookies, and shouldn't ask us to acknowledge them again.
      sign_in admin
      visit_homepage_and_wait_for_load
      expect(page).not_to have_selector(CookieBannerHelper::ACKNOWLEDGE_SELECTOR)
    end
  end
end

def visit_homepage_and_wait_for_load
  # Go to the homepage and wait for something to show up.
  visit "/"
  expect(page).to have_selector("footer")
end
