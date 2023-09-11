# frozen_string_literal: true

class CreateRoles < ActiveRecord::Migration[7.0]
  def change
    create_table :roles do |t|
      t.integer :user_id, null: false, foreign_key: { to_table: :users }
      t.references :group, null: false, foreign_key: { to_table: :groups }
      t.date :start_date, null: false
      t.date :end_date
      t.bigint :metadata_id
      t.string :metadata_type
      t.timestamps
    end
  end
end
