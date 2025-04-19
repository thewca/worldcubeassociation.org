# frozen_string_literal: true

class InvoiceItem < ApplicationRecord
  belongs_to :registration

  enum :status, { unpaid: 0, paid: 1, waived: 2 }

  validate :consistent_currency_code

  monetize :amount_lowest_denomination,
           as: 'amount',
           with_model_currency: :currency_code

  def consistent_currency_code
    existing_items = registration.invoice_items.where.not(id: id)
    return if existing_items.empty?

    expected_currency = existing_items.first.currency_code
    return unless currency_code != expected_currency

    errors.add(:currency_code, "must be #{expected_currency} to match existing items in this registration")
  end
end
