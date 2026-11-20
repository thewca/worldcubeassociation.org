# frozen_string_literal: true

require 'rails_helper'
require 'currency_data'

RSpec.describe CurrencyData do
  it 'keeps the static currency data in sync with RubyMoney' do
    currencies = JSON.parse(CurrencyData.data_file_path.read)

    expect(currencies).to eq(CurrencyData.to_h.deep_stringify_keys)
  end

  it 'uses the subunits of the currency' do
    expect(CurrencyData.to_h.dig('EUR', :subunit_to_unit)).to eq(100)
  end

  it 'does not use subunits for currencies that have none in practice' do
    expect(CurrencyData.to_h.dig('HUF', :subunit_to_unit)).to eq(1)
  end
end
