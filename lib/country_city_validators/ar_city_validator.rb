# frozen_string_literal: true

module CountryCityValidators
  AR_PROVINCES = %w(
    Buenos\ Aires
    Catamarca
    Chaco
    Chubut
    Corrientes
    Córdoba
    Entre\ Ríos
    Formosa
    Jujuy
    La\ Pampa
    La\ Rioja
    Mendoza
    Misiones
    Neuquén
    Río\ Negro
    Salta
    San\ Juan
    San\ Luis
    Santa\ Cruz
    Santa\ Fe
    Santiago\ del\ Estero
    Tierra\ del\ Fuego
    Tucumán
  ).to_set

  class ArCityValidator < CityCommaRegionValidator
    def initialize
      super(type_of_region: "province", valid_regions: AR_PROVINCES)
    end

    def self.country_iso_2
      "AR"
    end
  end
end
