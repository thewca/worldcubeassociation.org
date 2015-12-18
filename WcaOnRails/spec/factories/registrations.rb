FactoryGirl.define do
  factory :registration do
    name { Faker::Name.name }
    guests ""
    comments ""
    eventIds "333"
    birthday "2015-04-30"
    competitionId { FactoryGirl.create(:competition).id }
    user_id { FactoryGirl.create(:user, :wca_id).id }

    trait :approved do
      status "a"
    end
  end
end
