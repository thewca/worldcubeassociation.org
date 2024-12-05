# frozen_string_literal: true

class CreateTickets < ActiveRecord::Migration[7.2]
  def change
    create_table :tickets do |t|
      t.references :metadata, polymorphic: true, null: false
      t.timestamps
    end
  end
end
