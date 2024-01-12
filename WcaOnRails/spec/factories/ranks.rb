# frozen_string_literal: true

FactoryBot.define do
  factory :ranks_average do
    transient do
      rank { 1 }
      event { '333' }
    end

    best { rank * 100 }
    worldRank { rank }
    continentRank { rank }
    countryRank { rank }
    eventId { event }
  end

  factory :ranks_single do
    transient do
      rank { 1 }
      event { '333' }
    end

    best { rank * 100 }
    worldRank { rank }
    continentRank { rank }
    countryRank { rank }
    eventId { event }
  end
end
