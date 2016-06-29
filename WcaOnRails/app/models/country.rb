# frozen_string_literal: true
class Country < ActiveRecord::Base
  self.table_name = "Countries"

  belongs_to :continent, foreign_key: :continentId

  scope :all_real, -> { where("name not like 'Multiple Countries%'") }

  MAX_ID_LENGTH = 50
  MAX_NAME_LENGTH = 50
  MAX_CONTINENTID_LENGTH = 3
  MAX_ISO2_LENGTH = 3
  validates :id, presence: true, uniqueness: true, length: { maximum: MAX_ID_LENGTH }
  validates :name, presence: true, uniqueness: true, length: { maximum: MAX_NAME_LENGTH }
  validates :continentId, presence: true, uniqueness: true, length: { maximum: MAX_CONTINENTID_LENGTH }
  validates :latitude, numericality: true
  validates :longitude, numericality: true
  validates :zoom, numericality: { only_integer: true }
  validates :iso2, presence: true, uniqueness: true, length: { maximum: MAX_ISO2_LENGTH }

  ALL_COUNTRIES_WITH_NAME_AND_ID = Country.all.map { |country| [country.name, country.id] }
end
