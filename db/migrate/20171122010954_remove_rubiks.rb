# frozen_string_literal: true

class RemoveRubiks < ActiveRecord::Migration[5.1]
  def up
    execute "DELETE FROM Events"
    load "#{Rails.root}/db/seeds/events.seeds.rb"
  end

  def down
    execute "DELETE FROM Events"
    load "#{Rails.root}/db/seeds/events.seeds.rb"
  end
end
