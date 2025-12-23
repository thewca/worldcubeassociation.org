# frozen_string_literal: true

class SanityCheckCategory < ApplicationRecord
  include StaticData

  has_many :sanity_checks

  def self.data_file_handle
    self.name.pluralize.underscore.to_s
  end
end
