# frozen_string_literal: true

class SanityCheckCategory < ApplicationRecord
  include StaticData
  has_many :sanity_check_results

  def self.data_file_handle
    "#{self.name.pluralize.underscore}"
  end

  def latest_results
    sanity_check_results.order(created_at: :desc).first
  end
end
