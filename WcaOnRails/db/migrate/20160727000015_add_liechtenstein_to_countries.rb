# frozen_string_literal: true

class AddLiechtensteinToCountries < ActiveRecord::Migration
  def change
    execute "
      INSERT INTO `Countries` (`id`, `name`, `continentId`, `latitude`, `longitude`, `zoom`, `iso2`) VALUES
      ('Liechtenstein', 'Liechtenstein', '_Europe', 0, 0, 0, 'LI');
    "
  end
end
