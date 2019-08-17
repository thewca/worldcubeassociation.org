# frozen_string_literal: true

class DelegateRegion < ApplicationRecord

  default_scope -> { where(is_active: true) }
  scope :with_inactive, -> { unscope(where: :is_active) }

  def self.c_all_by_friendly_id
    @@delegate_regions_by_friendly_id ||= all.with_inactive.index_by(&:friendly_id)
  end

  def self.c_find_by_friendly_id!(friendly_id)
    self.c_all_by_friendly_id[friendly_id] || raise("friendly id not found #{friendly_id}")
  end

  def self.africa
    DelegateRegion.c_find_by_friendly_id!('africa')
  end

  def self.asia_east
    DelegateRegion.c_find_by_friendly_id!('asia_east')
  end

  def self.asia_japan
    DelegateRegion.c_find_by_friendly_id!('asia_japan')
  end

  def self.asia_southeast
    DelegateRegion.c_find_by_friendly_id!('asia_southeast')
  end

  def self.asia_west_india
    DelegateRegion.c_find_by_friendly_id!('asia_west_india')
  end

  def self.europe_east_middle_east
    DelegateRegion.c_find_by_friendly_id!('europe_east_middle_east')
  end

  def self.europe_north_baltic_states
    DelegateRegion.c_find_by_friendly_id!('europe_north_baltic_states')
  end

  def self.europe_west
    DelegateRegion.c_find_by_friendly_id!('europe_west')
  end

  def self.latin_america
    DelegateRegion.c_find_by_friendly_id!('latin_america')
  end

  def self.oceania
    DelegateRegion.c_find_by_friendly_id!('oceania')
  end

  def self.usa_canada
    DelegateRegion.c_find_by_friendly_id!('usa_canada')
  end

  def self.usa_east_canada
    DelegateRegion.c_find_by_friendly_id!('usa_east_canada')
  end

  def self.usa_west
    DelegateRegion.c_find_by_friendly_id!('usa_west')
  end

  def self.world
    DelegateRegion.c_find_by_friendly_id!('world')
  end
end
