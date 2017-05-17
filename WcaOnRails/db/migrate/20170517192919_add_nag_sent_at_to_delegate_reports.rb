# frozen_string_literal: true

class AddNagSentAtToDelegateReports < ActiveRecord::Migration[5.0]
  def change
    add_column :delegate_reports, :nag_sent_at, :datetime
  end
end
