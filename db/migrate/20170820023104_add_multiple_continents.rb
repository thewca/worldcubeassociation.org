# frozen_string_literal: true

class AddMultipleContinents < ActiveRecord::Migration[5.1]
  def up
    execute "DELETE FROM Continents"
    load Rails.root.join("db/seeds/continents.seeds.rb").to_s
  end

  def down
    execute "DELETE FROM Continents"
    load Rails.root.join("db/seeds/continents.seeds.rb").to_s
  end
end
