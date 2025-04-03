# frozen_string_literal: true

class AddRegistrationDropdown < ActiveRecord::Migration[7.2]
  def change
    add_column :Competitions, :registration_dropdown_enabled, :boolean, default: false
    add_column :Competitions, :registration_dropdown_title, :string
    add_column :Competitions, :registration_dropdown_options, :text
    add_column :Competitions, :registration_dropdown_required, :boolean, default: false

    add_column :registrations, :dropdown_selection, :string
  end
end
