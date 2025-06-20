# frozen_string_literal: true

require 'json'

module Locales
  AVAILABLE_FILE = File.join(__dir__, 'available.json')

  # Ordered alphabetically by their local code, but with English first.
  AVAILABLE = ::JSON.parse(File.read(AVAILABLE_FILE), symbolize_names: true).freeze
end
