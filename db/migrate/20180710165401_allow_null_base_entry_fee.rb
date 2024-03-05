# frozen_string_literal: true

class AllowNullBaseEntryFee < ActiveRecord::Migration[5.2]
  def change
    change_column_null(:Competitions, :base_entry_fee_lowest_denomination, true)
    change_column_default(:Competitions, :base_entry_fee_lowest_denomination, from: 0, to: nil)
    Competition.where(base_entry_fee_lowest_denomination: 0).update_all(base_entry_fee_lowest_denomination: nil)
  end
end
