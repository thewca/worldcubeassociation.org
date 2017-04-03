# frozen_string_literal: true
class RoundType < ApplicationRecord
  include Cachable
  self.table_name = "RoundTypes"

  has_many :results, foreign_key: :roundTypeId

  scope :final_rounds, -> { where("final = 1") }

  def name
    I18n.t("rounds.#{id}.name")
  end

  def cellName
    I18n.t("rounds.#{id}.cellName")
  end

  # TODO: move to database https://github.com/thewca/worldcubeassociation.org/issues/979
  def combined?
    %w(c d e g h).include?(id)
  end
end
