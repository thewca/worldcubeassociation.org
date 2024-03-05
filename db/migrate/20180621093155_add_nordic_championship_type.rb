# frozen_string_literal: true

class AddNordicChampionshipType < ActiveRecord::Migration[5.2]
  def change
    %w(DK FI IS NO SE).each do |iso2|
      EligibleCountryIso2ForChampionship.create!(championship_type: "nordic", eligible_country_iso2: iso2)
    end
  end
end
