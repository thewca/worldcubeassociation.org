# frozen_string_literal: true

after :countries do
  {
    "greater_china" => ["China", "Hong Kong", "Macau", "Taiwan"],
  }.each do |championship_type, country_names|
    Country.where(name: country_names).pluck(:iso2).each do |iso2|
      EligibleCountryIso2ForChampionship.create!(championship_type: championship_type, eligible_country_iso2: iso2)
    end
  end
end
