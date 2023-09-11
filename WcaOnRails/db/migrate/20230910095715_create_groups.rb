# frozen_string_literal: true

class CreateGroups < ActiveRecord::Migration[7.0]
  def change
    create_table :groups do |t|
      t.string :name, null: false
      t.string :group_type, null: false
      t.references :parent_group, foreign_key: { to_table: :groups }
      t.boolean :is_active, null: false
      t.boolean :is_hidden, null: false
      t.bigint :metadata_id
      t.string :metadata_type
      t.timestamps
    end
  end
end
