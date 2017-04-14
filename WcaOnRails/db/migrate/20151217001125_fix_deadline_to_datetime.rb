# frozen_string_literal: true

class FixDeadlineToDatetime < ActiveRecord::Migration
  def change
    remove_column :polls, :deadline
    add_column :polls, :deadline, :datetime
  end
end
