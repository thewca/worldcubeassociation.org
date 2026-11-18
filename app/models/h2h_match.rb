# frozen_string_literal: true

class H2hMatch < ApplicationRecord
  belongs_to :round
  has_many :h2h_match_competitors, dependent: :destroy
  has_many :users, through: :h2h_match_competitors
  has_many :h2h_sets, -> { order(:set_number) }, inverse_of: :h2h_match, dependent: :destroy

  alias_method :competitors, :h2h_match_competitors
  alias_method :sets, :h2h_sets

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[match_number],
    methods: %w[competitors sets],
  }.freeze

  # A defalt set of data to use with .includes() when serializing H2H matches into JSON
  SERIALIZATION_INCLUDES = [
    { h2h_match_competitors: :user },
    { h2h_sets: { h2h_attempts: %i[h2h_match_competitor live_attempt result_attempt] } },
    { round: [{ results: { person: :user } }, { live_results: :registration }] },
  ].freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
