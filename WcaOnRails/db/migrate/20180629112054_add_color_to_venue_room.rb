# frozen_string_literal: true

class AddColorToVenueRoom < ActiveRecord::Migration[5.2]
  def change
    add_column :venue_rooms, :color, :string, default: VenueRoom::DEFAULT_ROOM_COLOR, allow_blank: false, limit: 7
  end
end
