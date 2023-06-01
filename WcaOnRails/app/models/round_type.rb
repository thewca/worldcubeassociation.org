# frozen_string_literal: true

class RoundType < ApplicationRecord
  include Cachable

  has_many :results
  has_many :scrambles, foreign_key: :roundTypeId

  scope :final_rounds, -> { where("final = 1") }

  def name
    I18n.t("rounds.#{id}.name")
  end

  def cell_name
    I18n.t("rounds.#{id}.cell_name")
  end

  # TODO: move to database https://github.com/thewca/worldcubeassociation.org/issues/979
  def combined?
    %w(c d e g h).include?(id)
  end

  # Returns the equivalent round_type_id with cutoff (or without cutoff)
  def self.toggle_cutoff(round_type_id)
    [%w(c f), %w(d 1), %w(e 2), %w(g 3), %w(h 0)]
      .flat_map { |pair| [pair, pair.reverse] }
      .to_h[round_type_id]
  end
end
