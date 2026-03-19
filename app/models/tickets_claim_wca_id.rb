# frozen_string_literal: true

class TicketsClaimWcaId < ApplicationRecord
  self.table_name = "tickets_claim_wca_id"

  enum :status, {
    open: "open",
    closed: "closed",
  }

  has_one :ticket, as: :metadata
  belongs_to :user

  ACTION_TYPE = {
    approve_claim: "approve_claim",
    reject_claim: "reject_claim",
    transfer_claim: "transfer_claim",
  }.freeze

  def metadata_actions_allowed_for(ticket_stakeholder)
    if ticket_stakeholder.actioner?
      [
        ACTION_TYPE[:approve_claim],
        ACTION_TYPE[:reject_claim],
        ACTION_TYPE[:transfer_claim],
      ]
    else
      []
    end
  end

  def eligible_roles_for_bcc(user)
    if user.admin?
      [
        TicketStakeholder.stakeholder_roles[:actioner],
        TicketStakeholder.stakeholder_roles[:requester],
      ]
    elsif user.any_kind_of_delegate?
      [
        TicketStakeholder.stakeholder_roles[:actioner],
      ]
    else
      []
    end
  end

  def self.create_ticket!(user)
    ActiveRecord::Base.transaction do
      ticket_metadata = TicketsClaimWcaId.create!(
        status: TicketsClaimWcaId.statuses[:open],
        user: user,
      )

      ticket = Ticket.create!(metadata: ticket_metadata)

      ticket.ticket_stakeholders.create!(
        stakeholder: user.delegate_to_handle_wca_id_claim,
        connection: TicketStakeholder.connections[:assigned],
        stakeholder_role: TicketStakeholder.stakeholder_roles[:actioner],
        is_active: true,
      )

      ticket.ticket_stakeholders.create!(
        stakeholder: user,
        connection: TicketStakeholder.connections[:cc],
        stakeholder_role: TicketStakeholder.stakeholder_roles[:requester],
        is_active: true,
      )
    end
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[user],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
