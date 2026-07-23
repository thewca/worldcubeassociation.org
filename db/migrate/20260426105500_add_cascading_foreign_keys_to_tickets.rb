# frozen_string_literal: true

class AddCascadingForeignKeysToTickets < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :ticket_comments, :tickets
    remove_foreign_key :tickets_competition_result, :competitions

    up_only do
      execute "DELETE FROM ticket_comments WHERE ticket_id NOT IN (SELECT id FROM tickets)"
      execute "DELETE FROM ticket_logs WHERE ticket_id NOT IN (SELECT id FROM tickets)"
      execute "DELETE FROM ticket_stakeholders WHERE ticket_id NOT IN (SELECT id FROM tickets)"
      execute "DELETE FROM ticket_log_changes WHERE ticket_log_id NOT IN (SELECT id FROM ticket_logs)"
      execute "DELETE FROM tickets_edit_person_fields WHERE tickets_edit_person_id NOT IN (SELECT id FROM tickets_edit_person)"
      execute "DELETE FROM tickets_competition_result WHERE competition_id NOT IN (SELECT id FROM competitions)"
    end

    add_foreign_key :ticket_comments, :tickets, on_delete: :cascade
    add_foreign_key :ticket_logs, :tickets, on_delete: :cascade
    add_foreign_key :ticket_stakeholders, :tickets, on_delete: :cascade
    add_foreign_key :ticket_log_changes, :ticket_logs, on_delete: :cascade
    add_foreign_key :tickets_edit_person_fields, :tickets_edit_person, on_delete: :cascade
    add_foreign_key :tickets_competition_result, :competitions, on_delete: :cascade
  end
end
