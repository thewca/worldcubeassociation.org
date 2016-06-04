FactoryGirl.define do
  factory :committee_position do
    sequence(:name) { |n| "Position #{n}" }
    description "Just a fake position."
    team_leader false
    committee
  end
end
