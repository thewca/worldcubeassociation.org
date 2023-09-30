# frozen_string_literal: true

class ServerSetting < ApplicationRecord
  self.primary_key = "name"

  BASE_LOCALE_HASH = 'en_translation_modification'

  def as_datetime
    Time.at(self.value.to_i).to_datetime
  end

  def as_boolean
    # ActiveRecord yields non-regular boolean values as TRUE
    ActiveRecord::Type::Boolean.new.cast self.value
  end
end
