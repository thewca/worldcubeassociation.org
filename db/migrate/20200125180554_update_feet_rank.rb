# frozen_string_literal: true

class UpdateFeetRank < ActiveRecord::Migration[5.2]
  def change
    # This change goes along updating the feet's rank in the seeds file.
    Event.delete_all
    load Rails.root.join("db/seeds/events.seeds.rb").to_s
  end
end
