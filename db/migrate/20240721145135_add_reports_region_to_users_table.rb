# frozen_string_literal: true

class AddReportsRegionToUsersTable < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :delegate_reports_region, :string, null: true, after: :receive_delegate_reports
  end
end
