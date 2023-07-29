# frozen_string_literal: true

class Region < ApplicationRecord
  self.table_name = "regions"

  def self.all_active
    Region.where(is_active: true)
  end

  def senior_delegates
    User.where(region_id: self.id).where(delegate_status: 'senior_delegate')
  end

  def senior_delegate
    senior_delegates.first
  end

  def delegates
    User.where(region_id: self.id).where.not(delegate_status: [nil, ""])
  end
end
