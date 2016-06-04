# frozen_string_literal: true
FactoryGirl.define do
  factory :team do
    sequence(:name) { |n| "WCA Team #{n}" }
    description "Just a fake team."
    committee

    trait :with_team_member do
      after(:create) do |team|
        committee_position = FactoryGirl.create(:committee_position, committee: team.committee)
        FactoryGirl.create(:team_member, team: team, committee_position: committee_position)
      end
    end
  end

end
