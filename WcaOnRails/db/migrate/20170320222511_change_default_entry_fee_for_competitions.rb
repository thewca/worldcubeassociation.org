# frozen_string_literal: true

class ChangeDefaultEntryFeeForCompetitions < ActiveRecord::Migration[5.0]
  def change
    Competition.where(base_entry_fee_lowest_denomination: nil).update_all(base_entry_fee_lowest_denomination: 0)
    change_column_default(:Competitions, :base_entry_fee_lowest_denomination, from: nil, to: 0)
    change_column_null(:Competitions, :base_entry_fee_lowest_denomination, false)
  end
end
