# frozen_string_literal: true

class CreateDelegatesTable < ActiveRecord::Migration[5.2]
  def change
    create_table :delegates do |t|
      t.references :user, null: false
      t.string :status, null: false
      t.references :delegate_region, null: false
      t.references :delegate_subregion
      t.references :country
      t.string :location
      t.date :start_date, null: false
      t.date :end_date
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
    end
  end
end
