# frozen_string_literal: true

class CreateTicketLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :ticket_logs do |t|
      t.bigint :ticket_id, null: false
      t.string :log, null: false
      t.timestamps
    end
  end
end
