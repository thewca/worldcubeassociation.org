# frozen_string_literal: true

class DropChampionshipIso2PrimaryKey < ActiveRecord::Migration[7.1]
  def change
    remove_column :eligible_country_iso2s_for_championship, :id
  end
end
