# frozen_string_literal: true

class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true
  # We are still reading from the primary in most cases
  connects_to database: { writing: :primary, reading: :primary, read_replica: :primary_replica }
end
