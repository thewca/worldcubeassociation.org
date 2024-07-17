# frozen_string_literal: true

class UpdateWcaStates < ActiveRecord::Migration[5.2]
  def up
    Country.delete_all
    Country.load_json_data!
    # Extra changes due to some changes in country names
    models=[Person, Result, Competition]
    models.each do |m|
      m.where(countryId: "Macedonia").update_all(countryId: "North Macedonia")
    end
    ActiveRecord::Base.connection.execute("update `archive_registrations` set `countryId` = 'North Macedonia' WHERE `archive_registrations`.`countryId` = 'Macedonia'")
  end

  def down
    Country.delete_all
    Country.load_json_data!
    models=[Person, Result, Competition]
    models.each do |m|
      m.where(countryId: "North Macedonia").update_all(countryId: "Macedonia")
    end
    ActiveRecord::Base.connection.execute("update `archive_registrations` set `countryId` = 'Macedonia' WHERE `archive_registrations`.`countryId` = 'North Macedonia'")
  end
end
