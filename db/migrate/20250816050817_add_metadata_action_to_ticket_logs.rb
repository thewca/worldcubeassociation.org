# frozen_string_literal: true

class AddMetadataActionToTicketLogs < ActiveRecord::Migration[7.2]
  def change
    add_column :ticket_logs, :metadata_action, :string, after: :action_type
  end
end
