# frozen_string_literal: true

class AddPaypalCapture < ActiveRecord::Migration[7.1]
  def change
    create_table :paypal_captures do |t|
      t.string :capture_id
      t.references :paypal_transaction, foreign_key: true
    end
  end
end
