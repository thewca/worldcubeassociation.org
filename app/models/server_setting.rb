# frozen_string_literal: true

class ServerSetting < ApplicationRecord
  self.primary_key = "name"

  BASE_LOCALE_HASH = 'en_translation_modification'
  TEST_VIDEO_ID_NAME = 'TEST_wc2025_video_url'
  LIVE_VIDEO_ID_NAME = 'wc2025_video_url'
  STAGING_OAUTH_LOGIN = 'staging_oauth_login_enabled'

  # Staging normally replaces the password form with an OAuth handoff to the
  # production site. Absent the setting the handoff stays on, so staging keeps
  # behaving as it does today; set it to false there to exercise the real form.
  def self.staging_oauth_login_enabled?
    setting = find_by(name: STAGING_OAUTH_LOGIN)
    setting.nil? || setting.as_boolean
  end

  def as_datetime
    Time.at(self.value.to_i).to_datetime
  end

  def as_boolean
    # ActiveRecord yields non-regular boolean values as TRUE
    ActiveRecord::Type::Boolean.new.cast self.value
  end
end
