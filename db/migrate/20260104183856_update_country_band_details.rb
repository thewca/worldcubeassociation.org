# frozen_string_literal: true

class UpdateCountryBandDetails < ActiveRecord::Migration[8.1]
  def up
    CountryBandDetail.where(number: 1).where(end_date: nil).update_all(end_date: '2025-12-31')
    CountryBandDetail.where(number: 2).where(end_date: nil).update_all(end_date: '2025-12-31')
    CountryBandDetail.where(number: 3).where(end_date: nil).update_all(end_date: '2025-12-31')
    CountryBandDetail.where(number: 4).where(end_date: nil).update_all(end_date: '2025-12-31')
    CountryBandDetail.create!(
      number: 1,
      start_date: '2026-01-01',
      due_amount_per_competitor_us_cents: 20,
      due_percent_registration_fee: 5,
    )
    CountryBandDetail.create!(
      number: 2,
      start_date: '2026-01-01',
      due_amount_per_competitor_us_cents: 50,
      due_percent_registration_fee: 5,
    )
    CountryBandDetail.create!(
      number: 3,
      start_date: '2026-01-01',
      due_amount_per_competitor_us_cents: 100,
      due_percent_registration_fee: 10,
    )
    CountryBandDetail.create!(
      number: 4,
      start_date: '2026-01-01',
      due_amount_per_competitor_us_cents: 225,
      due_percent_registration_fee: 15,
    )
  end

  def down
    CountryBandDetail.where(number: 1).where(start_date: '2026-01-01').delete_all
    CountryBandDetail.where(number: 2).where(start_date: '2026-01-01').delete_all
    CountryBandDetail.where(number: 3).where(start_date: '2026-01-01').delete_all
    CountryBandDetail.where(number: 4).where(start_date: '2026-01-01').delete_all
    CountryBandDetail.where(number: 1).where(start_date: '2018-01-01').update_all(end_date: nil)
    CountryBandDetail.where(number: 2).where(start_date: '2018-01-01').update_all(end_date: nil)
    CountryBandDetail.where(number: 3).where(start_date: '2018-01-01').update_all(end_date: nil)
    CountryBandDetail.where(number: 4).where(start_date: '2018-01-01').update_all(end_date: nil)
  end
end
