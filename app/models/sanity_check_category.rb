# frozen_string_literal: true

class SanityCheckCategory < ApplicationRecord
  include StaticData

  has_many :sanity_checks
  has_many :sanity_check_results, through: :sanity_checks
  has_many :latest_results, through: :sanity_checks

  def folder_handle
    "#{self.id} - #{self.name.parameterize.underscore}"
  end
end
