# frozen_string_literal: true

class AddVersionColumnToDelegateReports < ActiveRecord::Migration[7.1]
  def change
    add_column :delegate_reports, :version, :integer, after: :competition_id, null: false, default: 0
  end
end
