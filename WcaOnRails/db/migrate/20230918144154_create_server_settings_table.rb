# frozen_string_literal: true

class CreateServerSettingsTable < ActiveRecord::Migration[7.0]
  def change
    create_table :server_settings, id: false do |t|
      t.string :name, primary_key: true
      t.string :value
      t.timestamps

      t.index ["name"], unique: true
    end
  end
end
