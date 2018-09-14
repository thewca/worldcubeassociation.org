# frozen_string_literal: true

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

CityValidator.add_validator_for_country "AR", CityCommaRegionValidator.new(type_of_region: "province", valid_regions: AR_PROVINCES)
