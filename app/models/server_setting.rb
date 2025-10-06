# frozen_string_literal: true

class ServerSetting < ApplicationRecord
  self.primary_key = "name"

  BASE_LOCALE_HASH = 'en_translation_modification'
  TEST_VIDEO_ID_NAME = 'TEST_wc2025_video_url'
  LIVE_VIDEO_ID_NAME = 'wc2025_video_url'
  WCA_LIVE_BETA_FEATURE_FLAG = 'wca_live_beta_feature_flag'

  # These are settings which should not appear in the public exports.
  # They are filtered out directly in `database_dumper` via a WHERE clause
  HIDDEN_SETTINGS = [
    WCA_LIVE_BETA_FEATURE_FLAG,
  ].freeze

  def as_datetime
    Time.at(self.value.to_i).to_datetime
  end

  def as_boolean
    # ActiveRecord yields non-regular boolean values as TRUE
    ActiveRecord::Type::Boolean.new.cast self.value
  end
end
