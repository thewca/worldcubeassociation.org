# frozen_string_literal: true

class AddAssignmentsToRegistration < ActiveRecord::Migration[5.2]
  def change
    add_column :registrations, :assignments, :text
  end
end
