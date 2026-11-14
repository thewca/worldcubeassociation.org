# frozen_string_literal: true

module CurrencyData
  def self.data_file_path
    StaticData::DATA_FOLDER.join('currencies.json')
  end

  def self.write_json_data!
    data_file_path.write("#{JSON.pretty_generate(to_h)}\n")
  end

  def self.to_h
    # As in app/webpacker/lib/wca-data.js.erb, exclude legacy aliases that overwrite canonical data
    currencies = Money::Currency.table.select { |key, currency| key.to_s == currency[:iso_code].downcase }

    currencies.values.to_h do |currency|
      attributes = currency.slice(:symbol, :symbol_first, :subunit_to_unit).merge(
        decimal_places: Money::Currency.new(currency[:iso_code]).decimal_places,
      )

      [currency[:iso_code], attributes]
    end
  end
end
