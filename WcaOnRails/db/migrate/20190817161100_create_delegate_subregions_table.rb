# frozen_string_literal: true

class CreateDelegateSubregionsTable < ActiveRecord::Migration[5.2]
  def change
    create_table :delegate_subregions do |t|
      t.string :name, null: false
      t.references :delegate_region, null: false
    end
  end
end
