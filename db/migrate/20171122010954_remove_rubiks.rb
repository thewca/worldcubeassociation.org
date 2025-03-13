# frozen_string_literal: true

class RemoveRubiks < ActiveRecord::Migration[5.1]
  def up
    execute "DELETE FROM Events"
    load Rails.root.join("db/seeds/events.seeds.rb").to_s
  end

  def down
    execute "DELETE FROM Events"
    load Rails.root.join("db/seeds/events.seeds.rb").to_s
  end
end
