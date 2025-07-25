# frozen_string_literal: true

class RemoveActionValueFromTicketLogs < ActiveRecord::Migration[7.2]
  def change
    reversible do |dir|
      dir.up do
        remove_column :ticket_logs, :action_value, :string
      end

      dir.down do
        add_column :ticket_logs, :action_value, :string
        TicketLogChange.find_each do |ticket_log_change|
          ticket_log_change.ticket_log.update!(action_value: ticket_log_change.field_value) if ticket_log_change.status?
        end
      end
    end
  end
end
