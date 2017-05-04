# frozen_string_literal: true

class CreateTimestamps < ActiveRecord::Migration[5.0]
  def change
    create_table :timestamps, id: false do |t|
      t.string :name, null: false
      t.datetime :date

      t.index :name, unique: true
    end
  end
end
