# frozen_string_literal: true

class PreferredFormat < ApplicationRecord
  belongs_to :event
  belongs_to :format

  def format
    Format.c_find(self.format_id)
  end

  default_scope -> { order(:ranking) }
end
