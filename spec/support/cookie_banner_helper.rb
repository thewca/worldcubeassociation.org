# frozen_string_literal: true

module CookieBannerHelper
  ACKNOWLEDGE_SELECTOR = '.js-cookies-eu button'

  def acknowledge_cookie_banner
    page.find(ACKNOWLEDGE_SELECTOR).click
  end
end
