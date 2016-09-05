# frozen_string_literal: true
{ "333" => %w(a 3 2 1),
  "444" => %w(a 3 2 1),
  "555" => %w(a 3 2 1),
  "222" => %w(a 3 2 1),
  "333bf" => %w(3 2 1),
  "333oh" => %w(a 3 2 1),
  "333fm" => %w(m 2 1),
  "333ft" => %w(m 2 1),
  "minx" => %w(a 3 2 1),
  "pyram" => %w(a 3 2 1),
  "sq1" => %w(a 3 2 1),
  "clock" => %w(a 3 2 1),
  "skewb" => %w(a 3 2 1),
  "666" => %w(m 2 1),
  "777" => %w(m 2 1),
  "444bf" => %w(3 2 1),
  "555bf" => %w(3 2 1),
  "333mbf" => %w(3 2 1),
  "magic" => %w(a),
  "mmagic" => %w(a),
  "333mbo" => %w(a),
}.each do |event_id, format_ids|
  format_ids.each_with_index do |format_id, i|
    PreferredFormat.create(event_id: event_id, format_id: format_id, ranking: (i + 1))
  end
end
