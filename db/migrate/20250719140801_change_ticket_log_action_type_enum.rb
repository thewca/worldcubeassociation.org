# frozen_string_literal: true

class ChangeTicketLogActionTypeEnum < ActiveRecord::Migration[7.2]
  def up
    execute <<-SQL.squish
      UPDATE ticket_logs
      SET action_type = CASE action_type
                        WHEN 'created' THEN 'create_ticket'
                        WHEN 'status_updated' THEN 'update_status'
                        ELSE action_type
                        END;
    SQL
  end

  def down
    execute <<-SQL.squish
      UPDATE ticket_logs
      SET action_type = CASE action_type
                        WHEN 'create_ticket' THEN 'created'
                        WHEN 'update_status' THEN 'status_updated'
                        ELSE action_type
                        END;
    SQL
  end
end
