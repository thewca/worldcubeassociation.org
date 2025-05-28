# frozen_string_literal: true

class AddRegistrantIdToRegistrations < ActiveRecord::Migration[7.2]
  def change
    add_column :registrations, :registrant_id, :integer, after: :competition_id
  end
end
