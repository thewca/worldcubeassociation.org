# frozen_string_literal: true

class AddCompetitionMainVenueBacklinking < ActiveRecord::Migration[8.1]
  def change
    add_reference :competitions, :main_venue, after: :main_event_id, null: true, foreign_key: { to_table: :competition_venues, on_update: :cascade, on_delete: :nullify }
    add_column :competitions, :is_multi_location, :boolean, null: false, default: false, after: :main_venue_id
  end
end
