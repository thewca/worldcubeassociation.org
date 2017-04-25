# frozen_string_literal: true

class CreateLinkings < ActiveRecord::Migration[5.0]
  def change
    create_table :linkings, id: false do |t|
      t.string :wca_id, null: false,  limit: 10
      t.text :wca_ids, null: false, limit: 16_777_215 # Make sure to use `mediumtext` by setting it's upper boundary.

      t.index :wca_id, unique: true
    end
  end
end
