# frozen_string_literal: true

class InvoiceItem < ApplicationRecord
  belongs_to :registration

  enum :status, {unpaid: 0, paid: 1, waived: 2}
end
