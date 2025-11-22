# frozen_string_literal: true

class InboxScramble < ApplicationRecord
  belongs_to :inbox_scramble_set, inverse_of: :inbox_scrambles
  belongs_to :matched_scramble_set, class_name: "InboxScrambleSet", optional: true, inverse_of: :matched_inbox_scrambles

  validates :scramble_number, uniqueness: { scope: %i[is_extra inbox_scramble_set_id] }
  validates :ordered_index, uniqueness: { scope: :matched_scramble_set_id }
end
