# frozen_string_literal: true

class AddPaidAtToRegistrationPayment < ActiveRecord::Migration[7.2]
  def change
    add_column :registration_payments, :paid_at, :datetime

    reversible do |direction|
      direction.up do
        execute <<~SQL.squish
          UPDATE registration_payments
          SET paid_at = created_at
          WHERE paid_at IS NULL
        SQL
      end
    end
  end
end
