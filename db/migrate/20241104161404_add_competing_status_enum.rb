# frozen_string_literal: true

class AddCompetingStatusEnum < ActiveRecord::Migration[7.2]
  def up
    add_column :registrations, :competing_status, :string, default: Registrations::Helper::STATUS_PENDING, null: false

    # Update values based on the old boolean column
    Registration.all do |r|
      r.update_column(:competing_status, r.compute_competing_status)
    end
  end
end
