# frozen_string_literal: true

class AddWrcAndWdcFieldsToDelegateReports < ActiveRecord::Migration[5.2]
  def change
    add_column :delegate_reports, :wrc_feedback_requested, :boolean, null: false, default: false
    add_column :delegate_reports, :wrc_incidents, :string, default: nil
    add_column :delegate_reports, :wdc_feedback_requested, :boolean, null: false, default: false
    add_column :delegate_reports, :wdc_incidents, :string, default: nil
  end
end
