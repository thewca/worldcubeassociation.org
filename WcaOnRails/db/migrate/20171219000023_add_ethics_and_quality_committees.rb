# frozen_string_literal: true

class AddEthicsAndQualityCommittees < ActiveRecord::Migration[5.1]
  def up
    execute "DELETE FROM teams"
    load "#{Rails.root}/db/seeds/teams.seeds.rb"
  end

  def down
    execute "DELETE FROM teams"
    load "#{Rails.root}/db/seeds/teams.seeds.rb"
  end
end
