# frozen_string_literal: true

FactoryBot.define do
  factory :ranks_average do
    transient do
      rank { 1 }
    end

    best { rank * 100 }
    world_rank { rank }
    continent_rank { rank }
    country_rank { rank }
  end

  factory :ranks_single do
    transient do
      rank { 1 }
    end

    best { rank * 100 }
    world_rank { rank }
    continent_rank { rank }
    country_rank { rank }
  end
end
