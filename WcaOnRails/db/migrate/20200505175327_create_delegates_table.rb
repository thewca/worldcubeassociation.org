# frozen_string_literal: true

class CreateDelegatesTable < ActiveRecord::Migration[5.2]
  def change
    create_table :delegates do |t|
      t.references :user, null: false
      t.string :status, null: false
      t.references :region, null: false
      t.string :country_iso2
      t.string :location
      t.date :start_date, null: false
      t.date :end_date
      t.datetime :created_at, null: false
      t.datetime :updated_at, null: false
    end
  end
end
