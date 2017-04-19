# frozen_string_literal: true

class PeoplePairWithCompetition < ApplicationRecord
  self.table_name = "people_pairs_with_competition"

  belongs_to :competition
end
