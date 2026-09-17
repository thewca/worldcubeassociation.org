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
    new_user_session_path(request.query_parameters.merge(classic: true))
  end

  def staging_oauth_login?
    Rails.env.production? && !EnvConfig.WCA_LIVE_SITE? && ServerSetting.staging_oauth_login_enabled?
  end
end
