# frozen_string_literal: true

class SetDefaultCurrencyToCompetitions < ActiveRecord::Migration[5.0]
  def up
    change_column_default :Competitions, :currency_code, "USD"
    Competition.where('currency_code="" or currency_code is null').update_all(currency_code: "USD")
  end
end
