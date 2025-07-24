# frozen_string_literal: true

class TicketLog < ApplicationRecord
  enum :action_type, {
    create_ticket: "create_ticket",
    update_status: "update_status",
    create_comment: "create_comment",
  }
  belongs_to :ticket
end
