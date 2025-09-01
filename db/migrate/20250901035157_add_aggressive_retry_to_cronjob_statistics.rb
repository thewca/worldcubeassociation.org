# frozen_string_literal: true

class AddAggressiveRetryToCronjobStatistics < ActiveRecord::Migration[7.2]
  def change
    add_column :cronjob_statistics, :is_aggressive_retry, :boolean, default: false, null: false, after: :recently_errored
  end
end
