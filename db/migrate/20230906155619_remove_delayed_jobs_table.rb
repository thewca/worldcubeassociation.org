# frozen_string_literal: true

class RemoveDelayedJobsTable < ActiveRecord::Migration[7.0]
  def change
    drop_table :delayed_jobs
    drop_table :completed_jobs
  end
end
