FactoryGirl.define do
  factory :registration do
    competitionId { FactoryGirl.create(:competition).id }
    user_id { FactoryGirl.create(:user, :wca_id).id }
    eventIds "333"
    guests ""
    comments ""

    trait :approved do
      status "a"
    end

    factory :userless_registration do
      name { Faker::Name.name }
      email { Faker::Internet.email }
      birthday "2015-04-30"
      after :create do |registration|
        registration.update_column(:user_id, nil)
      end
    end
  end
end
