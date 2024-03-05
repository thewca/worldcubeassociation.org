# frozen_string_literal: true

# copied from https://github.com/fnando/i18n-js/blob/main/MIGRATING_FROM_V3_TO_V4.md
Rails.application.config.after_initialize do
  require "i18n-js/listen"
  # This will only run in development.
  I18nJS.listen if Rails.env.development?
end
