# frozen_string_literal: true

class AddReportsRegionToUsersTable < ActiveRecord::Migration[7.1]
  def change
    add_reference :users, :delegate_reports_region, polymorphic: true, index: true, type: :string, null: true, after: :receive_delegate_reports
  end
end
