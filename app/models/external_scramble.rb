# frozen_string_literal: true

class ExternalScramble < ApplicationRecord
  belongs_to :external_scramble_set

  has_many :matched_scrambles, dependent: :nullify

  scope :not_extra, -> { where(is_extra: false) }

  validates :scramble_number, uniqueness: { scope: %i[is_extra external_scramble_set_id] }

  # rubocop:disable Naming/PredicatePrefix
  #   See matched_scramble.rb for an explanation on why we need this
  def is_extra_tinyint
    self.is_extra? ? 1 : 0
  end
  # rubocop:enable Naming/PredicatePrefix
end
