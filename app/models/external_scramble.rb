# frozen_string_literal: true

class ExternalScramble < ApplicationRecord
  default_scope { order(:is_extra, :scramble_number) }

  belongs_to :external_scramble_set

  has_many :matched_scrambles, dependent: :delete_all

  scope :not_extra, -> { where(is_extra: false) }

  validates :scramble_number, uniqueness: { scope: %i[is_extra external_scramble_set_id] }
end
