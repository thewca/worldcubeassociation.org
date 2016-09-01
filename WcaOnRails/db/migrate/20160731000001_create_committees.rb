# frozen_string_literal: true
class CreateCommittees < ActiveRecord::Migration
  def change
    create_table :committees do |t|
      t.string :name, limit: 50, null: false
      t.string :slug, limit: 50, null: false
      t.text :duties, null: false
      t.string :email, null: false
      t.timestamps null: false
    end
    add_index :committees, :name, unique: true
    add_index :committees, :slug, unique: true
  end
end
