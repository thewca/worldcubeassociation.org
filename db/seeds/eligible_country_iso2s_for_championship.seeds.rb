# frozen_string_literal: true

after :countries do
  EligibleCountryIso2ForChampionship.load_json_data!
end
