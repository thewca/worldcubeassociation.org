class ChangeDeadlineToTimestamp < ActiveRecord::Migration
  def change
    change_column :polls, :deadline, :timestamp
  end
end
