# frozen_string_literal: true

class AddGreaterChinaChampionshipType < ActiveRecord::Migration[5.1]
  def change
    %w(CN HK MO TW).each do |iso2|
      EligibleCountryIso2ForChampionship.create!(championship_type: "greater_china", eligible_country_iso2: iso2)
    end
  end
end
