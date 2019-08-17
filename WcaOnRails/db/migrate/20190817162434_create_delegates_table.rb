# frozen_string_literal: true

class CreateDelegatesTable < ActiveRecord::Migration[5.2]
  def change
    create_table :delegates do |t|
      t.references :user, null: false
      t.string :delegate_status, null: false
      t.references :delegate_region, null: false
      t.references :delegate_subregion
      t.string :country_id
      t.string :location
      t.datetime :start_date, null: false
      t.datetime :end_date
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
    end
  end
end
