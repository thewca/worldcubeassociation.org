# frozen_string_literal: true

class ChangeStakeholderIdToStringInTicketStakeholders < ActiveRecord::Migration[7.2]
  def change
    reversible do |dir|
      dir.up do
        change_column :ticket_stakeholders, :stakeholder_id, :string, limit: 255
      end

      dir.down do
        change_column :ticket_stakeholders, :stakeholder_id, :bigint
      end
    end
  end
end
