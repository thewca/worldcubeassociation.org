# frozen_string_literal: true
class UserPreferredEvent < ActiveRecord::Base
  belongs_to :user
  belongs_to :event
end
