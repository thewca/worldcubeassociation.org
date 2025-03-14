# frozen_string_literal: true

class Invoices < ApplicationRecord
  has_many :invoice_items
  belongs_to :owner, polymorphic: true
end
