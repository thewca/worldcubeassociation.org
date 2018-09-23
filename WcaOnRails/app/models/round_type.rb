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

  # Returns the equivalent round_type_id with cutoff (or without cutoff)
  def self.equivalent(round_type_id)
    case round_type_id
    when "c"
      "f"
    when "f"
      "c"
    when "d"
      "1"
    when "1"
      "d"
    when "e"
      "2"
    when "2"
      "e"
    when "g"
      "3"
    end
  end
end
