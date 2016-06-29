# frozen_string_literal: true
class Continent < ActiveRecord::Base
  self.table_name = "Continents"

  has_many :countries, foreign_key: :continentId

  MAX_ID_LENGTH = 50
  MAX_NAME_LENGTH = 50
  MAX_RECORDNAME_LENGTH = 3
  validates :id, presence: true, uniqueness: true, length: { maximum: MAX_ID_LENGTH }
  validates :name, presence: true, uniqueness: true, length: { maximum: MAX_NAME_LENGTH }
  validates :recordName, presence: true, uniqueness: true, length: { maximum: MAX_RECORDNAME_LENGTH }
  validates :latitude, numericality: true
  validates :longitude, numericality: true
  validates :zoom, numericality: { only_integer: true }

  ALL_CONTINENTS_WITH_NAME_AND_ID = Continent.all.map { |continent| [continent.name, continent.id] }
end
