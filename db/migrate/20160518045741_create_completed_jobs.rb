# frozen_string_literal: true

class CreateCompletedJobs < ActiveRecord::Migration
  def change
    # Idea for storing completed jobs inspired by
    #  http://stackoverflow.com/a/28217770/1739415
    create_table :completed_jobs do |table|
      table.integer :priority, default: 0, null: false # Allows some jobs to jump to the front of the queue
      table.integer :attempts, default: 0, null: false # Provides for retries, but still fail eventually.
      table.text :handler,                 null: false # YAML-encoded string of the object that will do work
      # table.text :last_error                           # reason for last failure (See Note below)
      table.datetime :run_at # When to run. Could be Time.zone.now for immediately, or sometime in the future.
      # table.datetime :locked_at # Set when a client is working on this object
      # table.datetime :failed_at # Set when all retries have failed (actually, by default, the record is deleted instead)
      # table.string :locked_by # Who is working on this object (if locked)
      table.string :queue # The name of the queue this job is in
      table.timestamps null: false

      table.datetime :completed_at # You won't find this in delayed_job's job table
    end
  end
end
