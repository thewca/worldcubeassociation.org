# frozen_string_literal: true

class CreateTicketStakeholders < ActiveRecord::Migration[7.2]
  def change
    create_table :ticket_stakeholders do |t|
      t.references :ticket, null: false
      t.references :stakeholder, polymorphic: true, null: false
      t.string :connection, null: false
      t.boolean :is_active, null: false
      t.timestamps
    end
  end
end
