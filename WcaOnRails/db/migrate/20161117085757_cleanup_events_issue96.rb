# frozen_string_literal: true

class CleanupEventsIssue96 < ActiveRecord::Migration
  def up
    execute 'DELETE FROM Events WHERE rank >= 1000'
  end
end
