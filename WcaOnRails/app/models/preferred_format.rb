# frozen_string_literal: true
class PreferredFormat < ApplicationRecord
  belongs_to :event
  belongs_to :format
end
