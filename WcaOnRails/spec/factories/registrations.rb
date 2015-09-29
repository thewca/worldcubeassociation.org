FactoryGirl.define do
  factory :registration do
    name { Faker::Name.name }
    guests ""
    comments ""
    eventIds ""
    factory :approved_registration do
      status "a"
    end
    factory :pending_registration do
      status "p"
    end
  end
end
