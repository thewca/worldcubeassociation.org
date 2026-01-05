# frozen_string_literal: true

class SanityCheckCategory < ApplicationRecord
  include StaticData

  has_many :sanity_checks

  def folder_handle
    "#{self.id} - #{self.name.gsub(/\s+/, '').underscore}"
  end
end
