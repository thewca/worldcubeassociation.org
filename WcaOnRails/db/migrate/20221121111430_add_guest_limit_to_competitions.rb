# frozen_string_literal: true

class AddGuestLimitToCompetitions < ActiveRecord::Migration[6.1]
    def change
        add_column :Competitions, :guests_per_registration_limit, :integer
        rename_column :Competitions, :free_guest_entry_status, :guest_entry_status
    end
end