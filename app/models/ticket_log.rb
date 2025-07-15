# frozen_string_literal: true

class TicketLog < ApplicationRecord
  enum :action_type, {
    created: "created",
    status_updated: "status_updated",
  }
  belongs_to :ticket
end
