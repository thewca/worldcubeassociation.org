# frozen_string_literal: true

class TicketLogChange < ApplicationRecord
  enum :field_name, {
    status: "status",
  }
  belongs_to :ticket_log
end
