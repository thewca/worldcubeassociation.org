# frozen_string_literal: true

class AddCompetingStatusEnum < ActiveRecord::Migration[7.2]
  def change
    add_column :registrations, :competing_status, :string, default: Registrations::Helper::STATUS_PENDING, null: false
    remove_column :registrations, :rejected_at
    remove_column :registrations, :waitlisted_at
  end
end
