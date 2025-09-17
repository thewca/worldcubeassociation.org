# frozen_string_literal: true

class TicketsEditPersonFieldsController < ApplicationController
  before_action :authenticate_user!
  before_action -> { check_ticket_errors(TicketLog.action_types[:metadata_action], TicketsEditPerson::ACTION_TYPE[:create_edit_person_change]) }, only: [:create]
  before_action -> { check_ticket_errors(TicketLog.action_types[:metadata_action], TicketsEditPerson::ACTION_TYPE[:update_edit_person_change]) }, only: [:update]
  before_action -> { check_ticket_errors(TicketLog.action_types[:metadata_action], TicketsEditPerson::ACTION_TYPE[:delete_edit_person_change]) }, only: [:destroy]

  private def check_ticket_errors(action_type, metadata_action = nil)
    @action_type = action_type
    @metadata_action = metadata_action
    @ticket = Ticket.find(params.require(:ticket_id))
    @acting_stakeholder = TicketStakeholder.find(params.require(:acting_stakeholder_id))

    render status: :bad_request, json: { error: "You are not a stakeholder for this ticket." } unless @ticket.user_stakeholders(current_user).include?(@acting_stakeholder)

    # Actions which are not metadata-actions are allowed for all stakeholders currently.
    return if metadata_action.nil?

    render status: :unauthorized, json: { error: "You are not allowed to perform this metadata action." } unless @acting_stakeholder.metadata_actions_allowed.include?(@metadata_action)
  end

  def create
    field_name = params.require(:field_name)
    old_value = params.require(:old_value)
    new_value = params.require(:new_value)

    ActiveRecord::Base.transaction do
      @created_field = @ticket.metadata.tickets_edit_person_fields.create!(
        field_name: TicketsEditPersonField.field_names[field_name],
        old_value: old_value,
        new_value: new_value,
      )
      @ticket.ticket_logs.create!(
        action_type: @action_type,
        acting_user_id: current_user.id,
        acting_stakeholder_id: @acting_stakeholder.id,
        metadata_action: @metadata_action,
      )
    end

    render status: :ok, json: @created_field
  end

  def update
    edit_person_field_id = params.require(:id)
    edit_person_field = TicketsEditPersonField.find(edit_person_field_id)
    new_value = params.require(:new_value)

    ActiveRecord::Base.transaction do
      edit_person_field.update!(new_value: new_value)
      @ticket.ticket_logs.create!(
        action_type: @action_type,
        acting_user_id: current_user.id,
        acting_stakeholder_id: @acting_stakeholder.id,
        metadata_action: @metadata_action,
      )
    end

    render status: :ok, json: { success: true }
  end

  def destroy
    edit_person_field_id = params.require(:id)
    edit_person_field = TicketsEditPersonField.find(edit_person_field_id)

    ActiveRecord::Base.transaction do
      edit_person_field.destroy!
      @ticket.ticket_logs.create!(
        action_type: @action_type,
        acting_user_id: current_user.id,
        acting_stakeholder_id: @acting_stakeholder.id,
        metadata_action: @metadata_action,
      )
    end

    render status: :ok, json: { success: true }
  end
end
