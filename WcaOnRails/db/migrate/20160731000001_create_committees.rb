# frozen_string_literal: true
class CreateCommittees < ActiveRecord::Migration
  def change
    create_table :committees do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.text :duties, null: false
      t.string :email, null: false
      t.timestamps null: false
    end
    add_index :committees, :name, unique: true
    add_index :committees, :slug, unique: true
  end
end
