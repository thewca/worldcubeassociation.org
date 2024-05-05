# frozen_string_literal: true

class AddMultipleContinents < ActiveRecord::Migration[5.1]
  def up
    execute "DELETE FROM Continents"
    load "#{Rails.root}/db/seeds/continents.seeds.rb"
  end

  def down
    execute "DELETE FROM Continents"
    load "#{Rails.root}/db/seeds/continents.seeds.rb"
  end
end
