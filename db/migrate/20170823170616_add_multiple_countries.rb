# frozen_string_literal: true

class AddMultipleCountries < ActiveRecord::Migration[5.1]
  def up
    execute "DELETE FROM Countries"
    load Rails.root.join("db/seeds/countries.seeds.rb").to_s
  end

  def down
    execute "DELETE FROM Countries"
    load Rails.root.join("db/seeds/countries.seeds.rb").to_s
  end
end
