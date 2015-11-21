class Person < ActiveRecord::Base
  self.table_name = "Persons"
  self.primary_key = "id"

  alias_method :wca_id, :id

  def sub_ids
    Person.where(id: id).map(&:subId)
  end

  def dob
    year == 0 || month == 0 || day == 0 ? nil : Date.new(year, month, day)
  end

  def countryIso2
    c = Country.find(countryId)
    c ? c.iso2 : nil
  end

  def to_jsonable(include_private_info: false)
    json = {
      class: self.class.to_s.downcase,
      url: "/results/p.php?i=#{self.wca_id}",

      id: self.id,
      wca_id: self.wca_id,
      name: self.name,

      gender: self.gender,
      country_iso2: self.countryIso2,
    }

    if include_private_info
      json[:dob] = person.dob
    end

    json
  end
end
