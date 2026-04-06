# frozen_string_literal: true

class RemoveUpdateStatusLogs < ActiveRecord::Migration[8.1]
  def change
    # We had used update_status multiple times, but they were not part of any real action. So we
    # cannot migrate this field to metadata_action and assign them any real action. I had two
    # options here:
    # 1. Delete all update_status logs
    # 2. Mark update_status field as deprecated
    # Though #2 is preferred solution generally, I am going with option 1 because tickets are still
    # in very early stage and the existing logs of update_status doesn't help us.
    TicketLog.where(action_type: "update_status").delete_all
  end
end
