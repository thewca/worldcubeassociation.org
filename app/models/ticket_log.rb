# frozen_string_literal: true

class TicketLog < ApplicationRecord
  enum :action_type, {
    create_ticket: "create_ticket",
    create_comment: "create_comment",
    join_as_bcc_stakeholder: "join_as_bcc_stakeholder",
    metadata_action: "metadata_action",
  }, prefix: true
  belongs_to :ticket
  has_many :ticket_log_changes, dependent: :destroy

  DEFAULT_SERIALIZE_OPTIONS = {
    include: %w[ticket_log_changes],
  }.freeze

  validate :validate_metadata_action
  def validate_metadata_action
    errors.add(:metadata_action, "can only be set when action_type is metadata_action") if !action_type_metadata_action? && metadata_action.present?

    errors.add(:metadata_action, "must be present when action_type is metadata_action") if action_type_metadata_action? && metadata_action.nil?

    return if metadata_action.nil? || ticket.metadata_type.safe_constantize::ACTION_TYPE.key?(metadata_action.to_sym)

    errors.add(:metadata_action, "is not a valid action")
  end

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
