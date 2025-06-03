# frozen_string_literal: true

class AddStakeholderRoleToTicketStakeholders < ActiveRecord::Migration[7.2]
  def change
    add_column :ticket_stakeholders, :stakeholder_role, :string
  end
end
