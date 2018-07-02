# frozen_string_literal: true

class AddColorToVenueRoom < ActiveRecord::Migration[5.2]
  def change
    add_column :venue_rooms, :color, :string, null: false, limit: 7
    VenueRoom.update_all(color: VenueRoom::DEFAULT_ROOM_COLOR)
  end
end
