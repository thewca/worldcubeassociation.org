# frozen_string_literal: true

class PreferredFormat < ApplicationRecord
  include StaticData

  belongs_to :event
  belongs_to :format

  def format
    Format.c_find(self.format_id)
  end

  default_scope -> { order(:ranking) }

  def self.all_raw
    self.static_json_data.flat_map do |event_id, format_ids|
      format_ids.map.with_index do |format_id, idx|
        { event_id: event_id, format_id: format_id, ranking: idx + 1 }
      end
    end
  end

  def self.dump_static
    self.unscoped
        .joins(:event)
        .order(:rank)
        .group_by(&:event_id)
        .transform_values { |el| el.sort_by(&:ranking).pluck(:format_id) }
        .as_json
  end
end
