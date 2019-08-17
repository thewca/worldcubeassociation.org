# frozen_string_literal: true

class CreateDelegateRegionsTable < ActiveRecord::Migration[5.2]
  def change
    create_table :delegate_regions do |t|
      t.string :name, null: false
      t.boolean :isActive, null: false
    end
  end
end
