# frozen_string_literal: true

class H2hMatchCompetitor < ApplicationRecord
  has_many :h2h_attempts, dependent: :destroy
  belongs_to :h2h_match
  belongs_to :user

  delegate :name, :wca_id, :country_iso2, to: :user

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[user_id],
    methods: %w[name wca_id country_iso2 final_pos],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end

  def final_pos
    h2h_match.round.h2h_final_positions_by_user_id[user_id]
  end
end
