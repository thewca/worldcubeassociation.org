# frozen_string_literal: true

class AddWrcFieldsToDelegateReports < ActiveRecord::Migration[5.2]
  def change
    add_column :delegate_reports, :wrc_feedback_requested, :boolean, null: false, default: false
    add_column :delegate_reports, :wrc_incidents, :string, default: nil
  end
end
