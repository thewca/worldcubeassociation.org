# frozen_string_literal: true

class RemoveActionValueFromTicketLogs < ActiveRecord::Migration[7.2]
  def change
    reversible do |dir|
      dir.down do
        TicketLogChange.find_each do |ticket_log_change|
          ticket_log_change.ticket_log.update!(action_value: ticket_log_change.field_value) if ticket_log_change.field_name_status?
        end
      end
    end

    remove_column :ticket_logs, :action_value, :string
  end
end
