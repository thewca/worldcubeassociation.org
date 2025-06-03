# frozen_string_literal: true

class PopulateStakeholderRoleForTicketStakeholders < ActiveRecord::Migration[7.2]
  def up
    TicketStakeholder.where(stakeholder_type: 'User').update_all(stakeholder_role: 'requester')
    TicketStakeholder.where(stakeholder_type: 'UserGroup').update_all(stakeholder_role: 'actioner')
  end

  def down
    TicketStakeholder.update_all(stakeholder_role: nil)
  end
end
