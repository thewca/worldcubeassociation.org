# frozen_string_literal: true
class VoteOption < ActiveRecord::Base

  belongs_to :vote
  belongs_to :poll_option

end
