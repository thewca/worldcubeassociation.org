# frozen_string_literal: true

class AddNeededIndexes < ActiveRecord::Migration[7.1]
  def change
    add_index :stripe_records, :stripe_id
    add_index :competition_tabs, :competition_id
  end
end
