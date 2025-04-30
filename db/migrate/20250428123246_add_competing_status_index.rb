# frozen_string_literal: true

class AddCompetingStatusIndex < ActiveRecord::Migration[7.2]
  def change
    add_index :registrations, [:competition_id, :competing_status]
  end
end
