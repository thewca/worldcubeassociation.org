# frozen_string_literal: true

class SanityCheckCategory < ApplicationRecord
  has_many :sanity_check_results

  def latest_results
    sanity_check_results.order(created_at: :desc).first
  end
end
