# frozen_string_literal: true

class AddRegistrationDropdown < ActiveRecord::Migration[7.2]
  def change
    change_table :Competitions, bulk: true do |t|
      t.boolean :registration_dropdown_enabled, default: false, null: false
      t.string :registration_dropdown_title
      t.text :registration_dropdown_options
      t.boolean :registration_dropdown_required, default: false, null: false
    end

    add_column :registrations, :dropdown_selection, :string
  end
end
