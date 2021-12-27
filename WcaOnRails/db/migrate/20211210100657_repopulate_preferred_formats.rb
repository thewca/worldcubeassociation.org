# frozen_string_literal: true

# This is done to clean up this table and make it comply with the 2020 regulations
class RepopulatePreferredFormats < ActiveRecord::Migration[6.0]
  def up
    PreferredFormat.delete_all

    formats = [
      { event_id: '333', format_id: 'a', ranking: 1 },
      { event_id: '222', format_id: 'a', ranking: 1 },
      { event_id: '444', format_id: 'a', ranking: 1 },
      { event_id: '555', format_id: 'a', ranking: 1 },
      { event_id: '666', format_id: 'm', ranking: 1 },
      { event_id: '777', format_id: 'm', ranking: 1 },
      { event_id: '333bf', format_id: '3', ranking: 1 },
      { event_id: '333fm', format_id: 'm', ranking: 1 },
      { event_id: '333fm', format_id: '2', ranking: 2 },
      { event_id: '333fm', format_id: '1', ranking: 3 },
      { event_id: '333oh', format_id: 'a', ranking: 1 },
      { event_id: 'clock', format_id: 'a', ranking: 1 },
      { event_id: 'minx',  format_id: 'a', ranking: 1 },
      { event_id: 'pyram', format_id: 'a', ranking: 1 },
      { event_id: 'skewb', format_id: 'a', ranking: 1 },
      { event_id: 'sq1',   format_id: 'a', ranking: 1 },
      { event_id: '444bf', format_id: '3', ranking: 1 },
      { event_id: '555bf', format_id: '3', ranking: 1 },
      { event_id: '333mbf', format_id: '1', ranking: 1 },
      { event_id: '333mbf', format_id: '2', ranking: 2 },
      { event_id: '333mbf', format_id: '3', ranking: 3 },
    ]

    formats.each do |f|
      PreferredFormat.create!(f)
    end
  end

  def down
    PreferredFormat.delete_all
  end
end
