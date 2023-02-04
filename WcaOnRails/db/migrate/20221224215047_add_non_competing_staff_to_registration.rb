# frozen_string_literal: true

class AddNonCompetingStaffToRegistration < ActiveRecord::Migration[7.0]
  def change
    add_column :registrations, :non_competing_staff, :boolean, default: false
  end
end
