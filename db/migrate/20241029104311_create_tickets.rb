# frozen_string_literal: true

class CreateTickets < ActiveRecord::Migration[7.2]
  def change
    create_table :tickets do |t|
      t.string :name, null: false
      t.string :ticket_type, null: false
      t.bigint :metadata_id, null: false
      t.string :metadata_type, null: false
      t.timestamps
    end
  end
end
