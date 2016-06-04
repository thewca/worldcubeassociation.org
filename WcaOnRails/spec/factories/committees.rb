FactoryGirl.define do
  factory :committee do
    sequence(:name) { |n| "WCA Software Committee #{n}" }
    email { Faker::Internet.email }
    duties 'Responsible for all WCA software'

    trait :with_team do
      teams { [ FactoryGirl.build(:team) ] }
    end
  end
end
