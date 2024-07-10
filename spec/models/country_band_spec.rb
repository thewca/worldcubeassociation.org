# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CountryBand do
  it 'validates valid band' do
    cb = CountryBand.new(number: 0, iso2: 'FR')
    expect(cb).to be_valid
  end

  it 'invalidates band with invalid country' do
    cb = CountryBand.new(number: 0, iso2: 'HELLO')
    expect(cb).to be_invalid_with_errors(iso2: ['is not included in the list'])
  end

  it 'invalidates band with invalid band id' do
    cb = CountryBand.new(number: 6, iso2: 'HELLO')
    expect(cb).to be_invalid_with_errors(number: ['is not included in the list'])
  end
end
