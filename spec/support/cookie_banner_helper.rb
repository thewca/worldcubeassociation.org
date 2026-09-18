# frozen_string_literal: true

module CookieBannerHelper
  ACKNOWLEDGE_SELECTOR = ".js-cookies-eu button"

  def acknowledge_cookie_banner
    # Clicking fires an async POST to /profile/acknowledge-cookies. Wait for its response, otherwise
    # a subsequent `clear_cookies` can drop the session cookie before the request goes out, and the
    # acknowledgement is never recorded in the database.
    page.driver.with_playwright_page do |pw_page|
      pw_page.expect_response("**#{profile_acknowledge_cookies_path}") do
        pw_page.click(ACKNOWLEDGE_SELECTOR)
      end
    end
  end
end
