# frozen_string_literal: true

class UpdatePreferredFormatsForFeet < ActiveRecord::Migration[5.1]
  def change
    PreferredFormat.where(event_id: "333ft").delete_all
    Event.c_find!("333ft").preferred_formats.create! [
      { format_id: 'a', ranking: 1 },
      { format_id: '3', ranking: 2 },
      { format_id: '2', ranking: 3 },
      { format_id: '1', ranking: 4 },
    ]
  end
end
