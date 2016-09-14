# frozen_string_literal: true
class Country < ActiveRecord::Base
  self.table_name = "Countries"

  belongs_to :continent, foreign_key: :continentId

  scope :real, -> { where("name not like 'Multiple Countries%'") }

  ALL_COUNTRIES_WITH_NAME_AND_ID = Country.all.map { |country| [country.name, country.id] }.freeze
end
