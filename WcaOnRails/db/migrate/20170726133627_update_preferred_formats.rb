# frozen_string_literal: true

class UpdatePreferredFormats < ActiveRecord::Migration[5.0]
  def change
    PreferredFormat.where(event_id: "333mbo").delete_all
    Event.c_find!("333mbo").preferred_formats.create [
      { format_id: '3', ranking: 1 },
      { format_id: '2', ranking: 2 },
      { format_id: '1', ranking: 3 },
    ]
  end
end
