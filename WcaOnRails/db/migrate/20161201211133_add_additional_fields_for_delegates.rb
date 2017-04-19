# frozen_string_literal: true

class AddAdditionalFieldsForDelegates < ActiveRecord::Migration
  def change
    add_column :users, :location_description, :string
    add_column :users, :phone_number, :string
    add_column :users, :notes, :string
  end
end
