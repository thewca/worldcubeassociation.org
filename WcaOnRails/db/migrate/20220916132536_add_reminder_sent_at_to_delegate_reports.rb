# frozen_string_literal: true

class AddReminderSentAtToDelegateReports < ActiveRecord::Migration[7.0]
  def change
    add_column :delegate_reports, :reminder_sent_at, :datetime
  end
end
