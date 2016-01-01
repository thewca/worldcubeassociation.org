FactoryGirl.define do
  factory :registration do
    transient do
      competition { FactoryGirl.create(:competition, :registration_open) }
      user { FactoryGirl.create(:user, :wca_id) }
    end
    competitionId { competition.id }
    user_id { user ? user.id : nil }
    eventIds "333"
    guests ""
    comments ""

    trait :accepted do
      status "a"
    end

    trait :pending do
      status "p"
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
