# frozen_string_literal: true

class H2hMatchCompetitor < ApplicationRecord
  has_many :h2h_attempts, dependent: :destroy
  belongs_to :h2h_match
  belongs_to :user

  def to_h2h_json(final_pos)
    {
      user_id: user_id,
      name: user.name,
      wca_id: user.wca_id,
      country_iso2: user.country_iso2,
      final_pos: final_pos,
    }
  end
end
