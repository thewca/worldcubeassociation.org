# frozen_string_literal: true

class TicketsEditPersonField < ApplicationRecord
  enum :field_name, {
    name: 'name',
    dob: 'dob',
    country_iso2: 'country_iso2',
    gender: 'gender',
  }, prefix: true

  validate :validate_values
  def validate_values
    if field_name_gender?
      gender_error_message = "must be one of the allowed genders"
      errors.add(:old_value, gender_error_message) unless User::ALLOWABLE_GENDERS.include?(old_value.to_sym)
      errors.add(:new_value, gender_error_message) unless User::ALLOWABLE_GENDERS.include?(new_value.to_sym)
    end

    if field_name_country_iso2?
      country_error_message = "must be one of the allowed countries"
      errors.add(:old_value, country_error_message) unless Country::WCA_COUNTRY_ISO_CODES.include?(old_value)
      errors.add(:new_value, country_error_message) unless Country::WCA_COUNTRY_ISO_CODES.include?(new_value)
    end
  end
end
