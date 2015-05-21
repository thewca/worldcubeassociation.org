FactoryGirl.define do
  factory :post do
    body { Faker::Lorem.paragraph }
    title { Faker::Hacker.say_something_smart }
    slug { title.parameterize }
    author
  end
end
