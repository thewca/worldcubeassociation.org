# frozen_string_literal: true

class CreateRegistrationV2 < ActiveRecord::Migration[7.2]
  def change
    create_table :v2_registrations do |t|
      t.references :user, null: false, index: true, foreign_key: true
      t.integer :guests
      t.references :competition, null: false, type: :string, index: true, foreign_key: true

      t.timestamps
    end
    add_index :v2_registrations, [:user_id, :competition_id], unique: true
  end
end
