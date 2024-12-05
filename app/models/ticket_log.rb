# frozen_string_literal: true

class TicketLog < ApplicationRecord
  enum :action_type, {
    status_updated: "status_updated",
  }
  belongs_to :ticket
end
