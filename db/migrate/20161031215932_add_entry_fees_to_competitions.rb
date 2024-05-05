# frozen_string_literal: true

class AddEntryFeesToCompetitions < ActiveRecord::Migration
  def change
    add_column :Competitions, :base_entry_fee_lowest_denomination, :integer
    add_column :Competitions, :currency_code, :string
  end
end
