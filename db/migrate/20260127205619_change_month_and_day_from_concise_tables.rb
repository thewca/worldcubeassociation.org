# frozen_string_literal: true

class ChangeMonthAndDayFromConciseTables < ActiveRecord::Migration[8.1]
  def change
    change_table :concise_single_results, bulk: true do |t|
      t.remove :month, type: :integer, limit: 2, default: 0, null: false, unsigned: true
      t.remove :day, type: :integer, limit: 2, default: 0, null: false, unsigned: true

      t.rename :year, :reg_year
    end

    change_table :concise_average_results, bulk: true do |t|
      t.remove :month, type: :integer, limit: 2, default: 0, null: false, unsigned: true
      t.remove :day, type: :integer, limit: 2, default: 0, null: false, unsigned: true

      t.rename :year, :reg_year
    end
  end
end
