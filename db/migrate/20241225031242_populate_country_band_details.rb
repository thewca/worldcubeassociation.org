# frozen_string_literal: true

class PopulateCountryBandDetails < ActiveRecord::Migration[7.2]
  def up
    CountryBandDetail.create!(
      number: 0,
      start_date: '2018-01-01',
      due_amount_per_competitor_us_cents: 0,
      due_percent_registration_fee: 0,
    )
    CountryBandDetail.create!(
      number: 1,
      start_date: '2018-01-01',
      due_amount_per_competitor_us_cents: 19,
      due_percent_registration_fee: 5,
    )
    CountryBandDetail.create!(
      number: 2,
      start_date: '2018-01-01',
      due_amount_per_competitor_us_cents: 32,
      due_percent_registration_fee: 5,
    )
    CountryBandDetail.create!(
      number: 3,
      start_date: '2018-01-01',
      due_amount_per_competitor_us_cents: 45,
      due_percent_registration_fee: 15,
    )
    CountryBandDetail.create!(
      number: 4,
      start_date: '2018-01-01',
      due_amount_per_competitor_us_cents: 228,
      due_percent_registration_fee: 15,
    )
    CountryBandDetail.create!(
      number: 5,
      start_date: '2018-01-01',
      due_amount_per_competitor_us_cents: 300,
      due_percent_registration_fee: 15,
    )
  end

  def down
    CountryBandDetail.delete_all
  end
end
