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

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
