# frozen_string_literal: true

class CreateCronjobStatisticsTable < ActiveRecord::Migration[7.0]
  def change
    create_table :cronjob_statistics, id: false do |t|
      t.string :name, primary_key: true
      t.datetime :run_start
      t.datetime :run_end
      t.boolean :last_run_successful, null: false, default: false
      t.text :last_error_message, null: true
      t.datetime :enqueued_at
      t.integer :recently_rejected, null: false, default: 0
      t.integer :recently_errored, null: false, default: 0
      t.integer :times_completed, null: false, default: 0
      t.bigint :average_runtime, null: true, default: nil
    end
  end
end
