# frozen_string_literal: true

class CreateSanityCheckStatisticsTable < ActiveRecord::Migration[7.0]
  def change
    create_table :sanity_check_statistics do |t|
      t.string :category, null: true
      t.datetime :run_start
      t.datetime :run_end
      t.json :result, null: true
      t.datetime :enqueued_at
      t.bigint :average_runtime, null: true, default: nil
    end
  end
end
