# frozen_string_literal: true

class CreateTicketLogChanges < ActiveRecord::Migration[7.2]
  def change
    create_table :ticket_log_changes do |t|
      t.references :ticket_log, null: false
      t.string :field_name, null: false
      t.string :field_value, null: false
      t.timestamps
    end

    reversible do |dir|
      dir.up do
        TicketLog.find_each do |ticket_log|
          if ticket_log.action_type_update_status?
            ticket_log.ticket_log_changes.create!(
              field_name: TicketLogChange.field_names[:status],
              field_value: ticket_log.action_value,
            )
          end
        end
      end
    end
  end
end
