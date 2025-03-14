# frozen_string_literal: true

class InvoiceItems < ApplicationRecord
  belongs_to :invoice
  belongs_to :productable, polymorphic: true
end
