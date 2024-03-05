# frozen_string_literal: true

class AddMultipleCountries < ActiveRecord::Migration[5.1]
  def up
    execute "DELETE FROM Countries"
    load "#{Rails.root}/db/seeds/countries.seeds.rb"
  end

  def down
    execute "DELETE FROM Countries"
    load "#{Rails.root}/db/seeds/countries.seeds.rb"
  end
end
