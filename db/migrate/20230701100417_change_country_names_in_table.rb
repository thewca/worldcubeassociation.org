# frozen_string_literal: true

class ChangeCountryNamesInTable < ActiveRecord::Migration[7.0]
  def change
    Country.where(id: 'Taiwan').update_all(name: 'Chinese Taipei')
    Country.where(id: 'Hong Kong').update_all(name: 'Hong Kong, China')
    Country.where(id: 'Macau').update_all(name: 'Macau, China')
  end
end
