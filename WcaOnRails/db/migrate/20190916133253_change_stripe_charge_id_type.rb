# frozen_string_literal: true

class ChangeStripeChargeIdType < ActiveRecord::Migration[5.2]
  def up
    change_column :stripe_charges, :stripe_charge_id, :string
  end

  def down
    change_column :stripe_charges, :stripe_charge_id, :integer
  end
end
