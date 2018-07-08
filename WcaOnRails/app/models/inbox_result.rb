# frozen_string_literal: true

class InboxResult < ApplicationRecord
  include Resultable

  # Order by event, then roundTypeId, then average if exists, then best if exists
  scope :sorted_for_competition, ->(competition_id) { where(competitionId: competition_id).order(:eventId, :roundTypeId).order(Arel.sql("if(formatId in ('a','m') and average>0, average, 2147483647), if(best>0, best, 2147483647)")) }

  self.table_name = "InboxResults"
end
