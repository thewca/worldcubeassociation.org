# rubocop:disable all
# frozen_string_literal: true

class CreateCountryBandDetails < ActiveRecord::Migration[7.2]
  def change
    create_table :country_band_details do |t|
      t.integer "number", null: false
      t.date "start_date", null: false
      t.date "end_date"
      t.integer "due_amount_per_competitor_us_cents", null: false
      t.integer "due_percent_registration_fee", null: false
      t.timestamps
    end
  end
end
