# frozen_string_literal: true

class RenameContinentAndCountriesColumns < ActiveRecord::Migration[7.2]
  def change
    change_table :Continents do |t|
      t.rename :recordName, :record_name
    end

    rename_table :Continents, :continents

    change_table :Countries do |t|
      t.rename :continentId, :continent_id
    end

    rename_table :Countries, :countries
  end
end
