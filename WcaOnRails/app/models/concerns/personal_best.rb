# frozen_string_literal: true

require 'active_support/concern'

module PersonalBest
  extend ActiveSupport::Concern

  def rank_to_wcif(type)
    {
      "eventId": eventId,
      "best": best,
      "worldRank": worldRank,
      "continentRank": continentRank,
      "countryRank": countryRank,
      "type": type,
    }
  end
end
