# frozen_string_literal: true
class CompetitionMedium < ActiveRecord::Base
  self.table_name = "CompetitionsMedia"
  # Work around the fact that the CompetitionsMedia has a type field.
  #  https://github.com/cubing/worldcubeassociation.org/issues/91#issuecomment-170194667
  self.inheritance_column = :_type_disabled

  belongs_to :competition, foreign_key: "competitionId"

  enum status: { accepted: "accepted", pending: "pending" }
  enum type: { report: "report", article: "article", multimedia: "multimedia" }
end
