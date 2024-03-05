# frozen_string_literal: true

module CountryCityValidators
  BR_STATES = %w(
    Acre
    Alagoas
    Amapá
    Amazonas
    Bahia
    Ceará
    Distrito\ Federal
    Espírito\ Santo
    Goiás
    Maranhão
    Mato\ Grosso
    Mato\ Grosso\ do\ Sul
    Minas\ Gerais
    Pará
    Paraíba
    Paraná
    Pernambuco
    Piauí
    Rio\ de\ Janeiro
    Rio\ Grande\ do\ Norte
    Rio\ Grande\ do\ Sul
    Rondônia
    Roraima
    Santa\ Catarina
    São\ Paulo
    Sergipe
    Tocantins
  ).to_set

  class BrCityValidator < CityCommaRegionValidator
    def initialize
      super(type_of_region: "state", valid_regions: BR_STATES)
    end

    def self.country_iso_2
      "BR"
    end
  end
end
