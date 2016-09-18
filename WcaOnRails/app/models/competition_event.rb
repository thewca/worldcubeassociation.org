# frozen_string_literal: true
class CompetitionEvent < ActiveRecord::Base
  belongs_to :competition
  belongs_to :event
end
