# frozen_string_literal: true

class CreateEligibleCountryIso2sForChampionship < ActiveRecord::Migration[5.1]
  def change
    create_table :eligible_country_iso2s_for_championship do |t|
      t.string :championship_type, null: false
      t.string :eligible_country_iso2, null: false
    end
    add_index :eligible_country_iso2s_for_championship, [:championship_type, :eligible_country_iso2],
              unique: true, name: "index_eligible_iso2s_for_championship_on_type_and_country_iso2"
  end
end
