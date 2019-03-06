# frozen_string_literal: true

class AddReceiveDelegateReportsColumnToUsersTable < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :receive_delegate_reports, :boolean, default: false, null: false
  end
end
