# frozen_string_literal: true

class CreateRoles < ActiveRecord::Migration[7.0]
  def change
    create_table :roles do |t|
      t.references :user, type: :integer, null: false, foreign_key: { to_table: :users }
      t.references :group, null: false, foreign_key: { to_table: :user_groups }
      t.date :start_date, null: false
      t.date :end_date
      t.bigint :metadata_id
      t.string :metadata_type
      t.timestamps
    end
  end
end
