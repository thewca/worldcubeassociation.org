# frozen_string_literal: true

class AddRegistrationRequirementsColumnsToCompetitions < ActiveRecord::Migration[5.2]
  def change
    add_column :Competitions, :on_the_spot_registration, :boolean, null: true, default: nil
    add_column :Competitions, :on_the_spot_entry_fee_lowest_denomination, :integer, null: true, default: nil
    add_column :Competitions, :refund_policy_percent, :integer, null: true, default: nil
    add_column :Competitions, :refund_policy_limit_date, :datetime, null: true, default: nil
    add_column :Competitions, :guests_entry_fee_lowest_denomination, :integer, null: true, default: nil
  end
end
