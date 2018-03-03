# frozen_string_literal: true

class CreateIncidents < ActiveRecord::Migration[5.1]
  def change
    create_table :incidents do |t|
      t.string :name
      t.text :private_description
      t.text :private_wrc_decision
      t.text :public_summary
      t.integer :status, default: 0

      t.timestamps
    end
  end
end
