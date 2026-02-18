# frozen_string_literal: true

class BackfillClaimWcaIdTicketsForExistingUsers < ActiveRecord::Migration[8.1]
  def up
    User.where.not(delegate_id_to_handle_wca_id_claim: nil).find_each do |user|
      TicketsClaimWcaId.create_ticket!(user)
    end
  end

  def down
    TicketsClaimWcaId.find_each do |tickets_claim_wca_id|
      ticket = tickets_claim_wca_id.ticket
      ticket.ticket_comments.destroy_all
      ticket.ticket_logs.destroy_all
      ticket.ticket_stakeholders.destroy_all
      tickets_claim_wca_id.destroy
      ticket.destroy
    end
  end
end
