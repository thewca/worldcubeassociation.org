# frozen_string_literal: true

class CreateSanityCheckStatisticsTable < ActiveRecord::Migration[7.0]
  def change
    create_table :sanity_check_results do |t|
      t.json :query_results, null: false
      # FK to cronjob_statistics.name (string PK)
      t.string :cronjob_statistic_name, null: false
      t.references :sanity_check, null: false
      t.timestamps
    end
  end
end
