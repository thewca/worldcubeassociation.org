# frozen_string_literal: true

require 'rails_helper'
require 'currency_data'

RSpec.describe CurrencyData do
  it 'keeps the static currency data in sync with RubyMoney' do
    currencies = JSON.parse(CurrencyData.data_file_path.read)

    expect(currencies).to eq(CurrencyData.to_h.deep_stringify_keys)
  end
end
