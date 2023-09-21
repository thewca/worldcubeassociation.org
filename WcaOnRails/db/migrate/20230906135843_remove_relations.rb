# frozen_string_literal: true

class RemoveRelations < ActiveRecord::Migration[7.0]
  def change
    drop_table :linkings
  end
end
