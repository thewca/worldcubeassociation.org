# frozen_string_literal: true

class AddAndPopulateStakeholderRoleToTicketStakeholders < ActiveRecord::Migration[7.2]
  def change
    add_column :ticket_stakeholders, :stakeholder_role, :string

    reversible do |dir|
      dir.up do
        TicketStakeholder.where(stakeholder_type: 'User').update_all(stakeholder_role: 'requester')
        TicketStakeholder.where(stakeholder_type: 'UserGroup').update_all(stakeholder_role: 'actioner')
      end

      dir.down do
        TicketStakeholder.update_all(stakeholder_role: nil)
      end
    end

    change_column_null :ticket_stakeholders, :stakeholder_role, false
  end
end
