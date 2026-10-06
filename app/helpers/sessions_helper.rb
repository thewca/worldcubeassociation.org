# frozen_string_literal: true

module SessionsHelper
  # The redesigned sign in page is the default. `classic` opts back into the old
  # one, and has to survive the round trip through `sessions#create`: both a
  # failed sign in and the 2FA prompt re-render these views from that action.
  def classic_sign_in?
    params[:classic].present?
  end

  # Signing in is usually the middle of a longer flow (OAuth above all), so the
  # switch must not drop anything the caller put on the sign in URL.
  def classic_sign_in_path
    new_user_session_path(**request.query_parameters, classic: true)
  end

  # Someone who opted back into the classic sign in page should stay in the old
  # experience end to end, so links out of it keep pointing at Rails. The
  # redesigned pages hand off to the Next frontend instead.
  def auth_page_url_options
    target_url = URI.parse(classic_sign_in? ? EnvConfig.ROOT_URL : EnvConfig.NEXT_FRONTEND_URL)
    { protocol: target_url.scheme, host: target_url.host, port: target_url.port }
  end

  # The Next frontend stores the chosen colour mode in this cookie. "system", or
  # no cookie at all, leaves it to the browser's own preference.
  def auth_page_theme
    cookies[:theme].presence_in(%w[light dark])
  end

  def staging_oauth_login?
    Rails.env.production? && !EnvConfig.WCA_LIVE_SITE? && ServerSetting.staging_oauth_login_enabled?
  end
end
