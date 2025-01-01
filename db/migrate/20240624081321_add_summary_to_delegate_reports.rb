# frozen_string_literal: true

class AddSummaryToDelegateReports < ActiveRecord::Migration[7.1]
  def change
    add_column :delegate_reports, :summary, :text, after: :competition_id
  end
end
