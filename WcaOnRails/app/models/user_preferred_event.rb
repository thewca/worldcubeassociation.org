# frozen_string_literal: true

class UserPreferredEvent < ApplicationRecord
  belongs_to :user
  belongs_to :event
end
