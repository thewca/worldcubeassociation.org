# frozen_string_literal: true

class UpdateListOfCountries < ActiveRecord::Migration[5.0]
  def up
    ActiveRecord::Base.transaction do
      Country.delete_all
      Country.load_json_data!
      # These substitions have been found by running the migration and checking
      # users with iso2 not matching anything in the 'Country' table.
      {
        # Virgin Islands -> United Kingdom
        "VG" => "GB",
        # Aruba -> Netherlands
        "AW" => "NL",
        # French Guinea -> France
        "GF" => "FR",
        # Pitcairn Islands -> United Kingdom
        "PN" => "GB",
        # Puerto Rico -> USA
        "PR" => "US",
        # Isle of Man -> United Kingdom
        "IM" => "GB",
        # French Polynesia -> France
        "PF" => "FR",
      }.each do |old_iso2, new_iso2|
        User.where(country_iso2: old_iso2).update_all(country_iso2: new_iso2)
      end
      {
        "Aruba" => "Netherlands",
        "Puerto Rico" => "USA",
      }.each do |old_id, new_id|
        Person.where(countryId: old_id).update_all(countryId: new_id)
        Result.where(countryId: old_id).update_all(countryId: new_id)
      end

      problems = []
      problems << User.where.not(country_iso2: Country.uncached_real.map(&:iso2))
      problems << Person.where.not(countryId: Country.uncached_real.map(&:id))
      problems.flatten!
      problematic_results = Result.where.not(countryId: Country.uncached_real.map(&:id))
      unless problems.empty? && problematic_results.empty?
        message = "Some people are stateless, please fix them (and their results!) and run the migration again!\n"
        message += "Here is a list of problematic users and persons:\n"
        problems.each do |p|
          message += "#{p.class}: #{p.id}, #{p.name}, #{p.has_attribute?('countryId') ? p.countryId : p.country_iso2}\n"
        end
        raise message
      end
    end
  end

  def down
  end
end
