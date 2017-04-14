# frozen_string_literal: true

class AddDelegateStatusToUsers < ActiveRecord::Migration
  def change
    add_column :users, :delegate_status, :string
    add_reference :users, :senior_delegate, index: true
  end
end
