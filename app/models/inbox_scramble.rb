# frozen_string_literal: true

class InboxScramble < ApplicationRecord
  default_scope { order(:is_extra, :scramble_number) }

  belongs_to :inbox_scramble_set

  validates :scramble_number, uniqueness: { scope: %i[is_extra inbox_scramble_set_id] }
end
