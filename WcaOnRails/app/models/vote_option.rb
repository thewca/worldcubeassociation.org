# frozen_string_literal: true

class VoteOption < ApplicationRecord
  belongs_to :vote
  belongs_to :poll_option
end
