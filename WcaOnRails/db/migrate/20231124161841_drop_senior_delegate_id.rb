# frozen_string_literal: true

class DropSeniorDelegateId < ActiveRecord::Migration[7.0]
  def change
    remove_column :users, :senior_delegate_id
  end
end
