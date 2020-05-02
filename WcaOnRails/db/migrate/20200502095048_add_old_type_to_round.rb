# frozen_string_literal: true

class AddOldTypeToRound < ActiveRecord::Migration[5.2]
  def change
    add_column :rounds, :old_type, :string, limit: 1, default: nil
  end
end
