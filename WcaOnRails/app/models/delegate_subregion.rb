# frozen_string_literal: true

class DelegateSubregion < ApplicationRecord
  belongs_to :delegate_region

  def self.c_all_by_friendly_id
    @@delegate_subregions_by_friendly_id ||= all.index_by(&:friendly_id)
  end

  def self.c_find_by_friendly_id!(friendly_id)
    self.c_all_by_friendly_id[friendly_id] || raise("friendly id not found #{friendly_id}")
  end

  def self.canada
    DelegateSubregion.c_find_by_friendly_id!('canada')
  end

  def self.california_usa
    DelegateSubregion.c_find_by_friendly_id!('california_usa')
  end

  def self.mid_atlantic_usa
    DelegateSubregion.c_find_by_friendly_id!('mid_atlantic_usa')
  end

  def self.midwest_usa
    DelegateSubregion.c_find_by_friendly_id!('midwest_usa')
  end

  def self.new_england_usa
    DelegateSubregion.c_find_by_friendly_id!('new_england_usa')
  end

  def self.canada
    DelegateSubregion.c_find_by_friendly_id!('pacific_northwest_usa')
  end

  def self.rockies_usa
    DelegateSubregion.c_find_by_friendly_id!('rockies_usa')
  end

  def self.south_usa
    DelegateSubregion.c_find_by_friendly_id!('south_usa')
  end

  def self.southeast_usa
    DelegateSubregion.c_find_by_friendly_id!('southeast_usa')
  end

  def self.brazil
    DelegateSubregion.c_find_by_friendly_id!('brazil')
  end

  def self.central_america
    DelegateSubregion.c_find_by_friendly_id!('central_america')
  end

  def self.south_america_central
    DelegateSubregion.c_find_by_friendly_id!('south_america_central')
  end

  def self.south_america_north
    DelegateSubregion.c_find_by_friendly_id!('south_america_north')
  end

  def self.south_america_south
    DelegateSubregion.c_find_by_friendly_id!('south_america_south')
  end
end
