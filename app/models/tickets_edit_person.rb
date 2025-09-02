# frozen_string_literal: true

class TicketsEditPerson < ApplicationRecord
  self.table_name = "tickets_edit_person"

  enum :status, {
    open: "open",
    closed: "closed",
  }

  has_one :ticket, as: :metadata
  has_many :tickets_edit_person_fields
  belongs_to :person, -> { current }, primary_key: :wca_id, foreign_key: :wca_id

  ACTION_TYPE = {
    approve_edit_person_request: "approve_edit_person_request",
    reject_edit_person_request: "reject_edit_person_request",
    create_edit_person_change: "create_edit_person_change",
    update_edit_person_change: "update_edit_person_change",
    delete_edit_person_change: "delete_edit_person_change",
    sync_edit_person_request: "sync_edit_person_request",
  }.freeze

  def metadata_actions_allowed_for(ticket_stakeholder)
    if ticket_stakeholder.stakeholder == UserGroup.teams_committees_group_wrt
      [
        ACTION_TYPE[:approve_edit_person_request],
        ACTION_TYPE[:reject_edit_person_request],
        ACTION_TYPE[:create_edit_person_change],
        ACTION_TYPE[:update_edit_person_change],
        ACTION_TYPE[:delete_edit_person_change],
        ACTION_TYPE[:sync_edit_person_request],
      ]
    else
      []
    end
  end

  def self.create_ticket(wca_id, changes_requested, requester)
    ActiveRecord::Base.transaction do
      ticket_metadata = TicketsEditPerson.create!(
        status: TicketsEditPerson.statuses[:open],
        wca_id: wca_id,
      )

      changes_requested.each do |change|
        TicketsEditPersonField.create!(
          tickets_edit_person_id: ticket_metadata.id,
          field_name: TicketsEditPersonField.field_names[change[:field]],
          old_value: change[:from],
          new_value: change[:to],
        )
      end

      ticket = Ticket.create!(metadata: ticket_metadata)

      TicketStakeholder.create!(
        ticket_id: ticket.id,
        stakeholder: UserGroup.teams_committees_group_wrt,
        connection: TicketStakeholder.connections[:assigned],
        stakeholder_role: TicketStakeholder.stakeholder_roles[:actioner],
        is_active: true,
      )
      requester_stakeholder = TicketStakeholder.create!(
        ticket_id: ticket.id,
        stakeholder: requester,
        connection: TicketStakeholder.connections[:cc],
        stakeholder_role: TicketStakeholder.stakeholder_roles[:requester],
        is_active: true,
      )

      TicketLog.create!(
        ticket_id: ticket.id,
        action_type: TicketLog.action_types[:create_ticket],
        acting_user_id: requester.id,
        acting_stakeholder_id: requester_stakeholder.id,
      )

      return ticket
    end
  end

  def out_of_sync
    tickets_edit_person_fields.any? do |edit_person_field|
      person.send(edit_person_field.field_name).to_s != edit_person_field.old_value
    end
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    include: {
      tickets_edit_person_fields: {},
      person: {
        only: %w[name gender],
        methods: %w[country_iso2],
        private_attributes: %w[dob],
      },
    },
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
