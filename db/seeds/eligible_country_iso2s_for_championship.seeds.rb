# frozen_string_literal: true

after :countries do
  StaticDataLoader.load_entities EligibleCountryIso2ForChampionship
end
