class Person < ActiveRecord::Base
  self.table_name = "Persons"
  self.primary_key = "id"

  def dob
    year == 0 || month == 0 || day == 0 ? nil : Date.new(year, month, day)
  end

  def countryIso2
    c = Country.find(countryId)
    c ? c.iso2 : nil
  end
end
