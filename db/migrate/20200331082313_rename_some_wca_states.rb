# frozen_string_literal: true

class RenameSomeWcaStates < ActiveRecord::Migration[5.2]
  def up
    Country.delete_all
    Country::ALL_STATES.each(&:save!)
    # This change goes along renaming some WCA States (see https://github.com/thewca/wca-regulations/issues/962).
    models=[Person, Result, Competition]
    models.each do |m|
      m.where(countryId: "Holy See").update_all(countryId: "Vatican City")
    end
    ActiveRecord::Base.connection.execute("update `archive_registrations` set `countryId` = 'Vatican City' WHERE `archive_registrations`.`countryId` = 'Holy See'")
  end

  def down
    Country.delete_all
    Country::ALL_STATES.each(&:save!)
    models=[Person, Result, Competition]
    models.each do |m|
      m.where(countryId: "Vatican City").update_all(countryId: "Holy See")
    end
    ActiveRecord::Base.connection.execute("update `archive_registrations` set `countryId` = 'Holy See' WHERE `archive_registrations`.`countryId` = 'Vatican City'")
  end
end
