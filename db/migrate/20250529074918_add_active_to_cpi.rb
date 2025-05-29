# frozen_string_literal: true

class AddActiveToCpi < ActiveRecord::Migration[7.2]
  def change
    add_column :competition_payment_integrations, :active, :boolean, after: :connected_account_id, default: true
  end
end
