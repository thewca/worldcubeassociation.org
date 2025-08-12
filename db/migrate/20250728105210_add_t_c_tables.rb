# frozen_string_literal: true

class AddTCTables < ActiveRecord::Migration[7.2]
  def change
    create_table :terms_and_conditions do |t|
      t.text :content, null: false
      t.references :competition, type: :string, null: false, foreign_key: true
      t.datetime :revoked_at, index: true

      t.timestamps
    end

    create_table :terms_and_conditions_accepts do |t|
      t.references :terms_and_conditions, null: false, foreign_key: true
      t.references :user, type: :integer, null: false, foreign_key: true
      t.datetime :accepted_at, null: false
      t.index %i[terms_and_conditions_id user_id], unique: true, name: 'index_terms_accepts_on_terms_and_user'

      t.timestamps
    end
  end
end
