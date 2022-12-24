# frozen_string_literal: true

class CachedResult < ApplicationRecord
  self.primary_key = "key_params"

  def parsed_payload
    JSON.parse(self.payload)
  end
end
