# frozen_string_literal: true

class ChangeTicketLogActionTypeEnum < ActiveRecord::Migration[7.2]
  def up
    TicketLog.where(action_type: 'created').update_all(action_type: 'create_ticket')
    TicketLog.where(action_type: 'status_updated').update_all(action_type: 'update_status')
  end

  def down
    TicketLog.where(action_type: 'create_ticket').update_all(action_type: 'created')
    TicketLog.where(action_type: 'update_status').update_all(action_type: 'status_updated')
  end
end
