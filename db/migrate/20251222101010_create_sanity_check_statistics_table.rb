# frozen_string_literal: true

class CreateSanityCheckStatisticsTable < ActiveRecord::Migration[7.0]
  def change
    create_table :sanity_check_results do |t|
      t.json :query_results, null: true
      t.references :cronjob_statistics, null: true
      t.timestamps
    end
  end
end
