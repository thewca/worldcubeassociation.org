# frozen_string_literal: true

require 'json'

module AvailableLocales
  AVAILABLE_FILE = File.join(__dir__, 'static_data', 'available_locales.json')

  # Ordered alphabetically by their local code, but with English first.
  ALL = ::JSON.parse(File.read(AVAILABLE_FILE), symbolize_names: true).freeze
end
