class FixDeadlineToDatetime < ActiveRecord::Migration
  def change
    change_column :polls, :deadline, :datetime
  end
end
