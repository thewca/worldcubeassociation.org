# frozen_string_literal: true

class ChangeScramblesIdToBigint < ActiveRecord::Migration[8.1]
  def up
    change_column :scrambles, :id, :bigint
  end

  def down
    change_column :scrambles, :id, :integer, unsigned: true
  end
end
