# frozen_string_literal: true

class AddMoreIndexesToRegistrations < ActiveRecord::Migration[7.1]
  def change
    add_index :registrations, :competition_id
    add_index :registration_payments, :registration_id
  end
end
