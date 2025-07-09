# frozen_string_literal: true

class ServerSetting < ApplicationRecord
  self.primary_key = "name"

  BASE_LOCALE_HASH = 'en_translation_modification'
  TEST_VIDEO_ID_NAME = 'TEST_wc2025_video_url'
  LIVE_VIDEO_ID_NAME = 'wc2025_video_url'

  def as_datetime
    Time.at(self.value.to_i).to_datetime
  end

  def as_boolean
    # ActiveRecord yields non-regular boolean values as TRUE
    ActiveRecord::Type::Boolean.new.cast self.value
  end
end
