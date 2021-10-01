# frozen_string_literal: true

class AddFreeGuestEntryStatusToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :free_guest_entry_status, :integer, null: false, default: 0
  end
end
