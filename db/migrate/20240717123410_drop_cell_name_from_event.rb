# frozen_string_literal: true

class DropCellNameFromEvent < ActiveRecord::Migration[7.1]
  def change
    remove_column :Events, :cellName
  end
end
