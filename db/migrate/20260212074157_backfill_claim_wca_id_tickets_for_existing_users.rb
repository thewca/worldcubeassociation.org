# frozen_string_literal: true

class BackfillClaimWcaIdTicketsForExistingUsers < ActiveRecord::Migration[8.1]
  def up
    User.where.not(delegate_id_to_handle_wca_id_claim: nil).find_each do |user|
      TicketsClaimWcaId.create_ticket!(user)
    end
  end

  def down
    TicketsClaimWcaId.destroy_all
  end
end
