# frozen_string_literal: true

class H2hMatch < ApplicationRecord
  belongs_to :round
  has_many :h2h_match_competitors, dependent: :destroy
  has_many :users, through: :h2h_match_competitors
  has_many :h2h_sets, dependent: :destroy

  def to_h2h_json(final_pos_by_user_id)
    {
      match_number: match_number,
      competitors: h2h_match_competitors.map { it.to_h2h_json(final_pos_by_user_id[it.user_id]) },
      sets: h2h_sets.sort_by(&:set_number).map(&:to_h2h_json),
    }
  end
end
