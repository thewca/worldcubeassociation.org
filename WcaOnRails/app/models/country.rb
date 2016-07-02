# frozen_string_literal: true
class Country < ActiveRecord::Base
  self.table_name = "Countries"

  belongs_to :continent, foreign_key: :continentId

  scope :all_real, -> { where("name not like 'Multiple Countries%'") }
end
