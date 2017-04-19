# frozen_string_literal: true

class AddMaldivesToCountries < ActiveRecord::Migration
  def up
    execute "INSERT INTO `Countries` (`id`, `name`, `continentId`, `iso2`) VALUES ('Maldives', 'Maldives', '_Asia', 'MV')"
  end

  def down
    execute "DELETE FROM `Countries` WHERE `id`='Maldives'"
  end
end
