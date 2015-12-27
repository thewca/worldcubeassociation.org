FactoryGirl.define do
  factory :ranks_average do
    transient do
      rank 1
    end

    worldRank { rank }
    continentRank { rank }
    countryRank { rank }
  end

  factory :ranks_single do
    transient do
      rank 1
    end

    worldRank { rank }
    continentRank { rank }
    countryRank { rank }
  end
end
