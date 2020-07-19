# frozen_string_literal: true

class RemoveAdditionalFieldsForDelegates < ActiveRecord::Migration[5.2]
  def change
    remove_column :users, :location_description, :string
    remove_column :users, :phone_number, :string
    remove_column :users, :notes, :string
  end
end
