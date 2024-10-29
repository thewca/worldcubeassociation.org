# frozen_string_literal: true

class CreateTicketStakeholders < ActiveRecord::Migration[7.2]
  def change
    create_table :ticket_stakeholders do |t|
      t.bigint :ticket_id, null: false
      t.integer :stakeholder_id, limit: 8, null: false
      t.string :stakeholder_type, null: false
      t.string :connection, null: false
      t.boolean :is_active, null: false
      t.timestamps
    end
  end
end
