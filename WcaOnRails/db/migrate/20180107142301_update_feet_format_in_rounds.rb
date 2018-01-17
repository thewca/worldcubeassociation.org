# frozen_string_literal: true

class UpdateFeetFormatInRounds < ActiveRecord::Migration[5.1]
  def change
    competitions_with_feet = Competition.includes(competition_events: [:rounds]).has_event("333ft").where("end_date >= ?", Date.new(2018, 1, 1))
    rounds_with_feet_mo3 = competitions_with_feet.map(&:competition_events).flatten.select { |e| e.event_id == "333ft" }.map(&:rounds).flatten.select { |r| r.format_id == "m" }
    rounds_with_feet_mo3.each do |r|
      r.update!(format_id: "a")
    end
  end
end
