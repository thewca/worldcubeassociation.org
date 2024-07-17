# frozen_string_literal: true

class PreferredFormat < ApplicationRecord
  include StaticData

  belongs_to :event
  belongs_to :format

  def format
    Format.c_find(self.format_id)
  end

  default_scope -> { order(:ranking) }

  def self.dump_static
    # In the ORDER BY call, `rank` comes from Event, `ranking` comes from PreferredFormat.
    self.unscoped.joins(:event).order(:rank, :ranking).as_json
  end
end
