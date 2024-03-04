# frozen_string_literal: true

class CreateStripeCharges < ActiveRecord::Migration[5.2]
  def change
    create_table :stripe_charges do |t|
      t.text :metadata, null: false
      t.integer :stripe_charge_id
      t.string :status, null: false
      t.text :error

      t.timestamps
    end

    add_index :stripe_charges, [:status]
  end
end
