# frozen_string_literal: true

class AddUniqueConstraintToStripe < ActiveRecord::Migration[8.1]
  def change
    add_index :stripe_records, %i[stripe_id stripe_record_type], unique: true
  end
end
