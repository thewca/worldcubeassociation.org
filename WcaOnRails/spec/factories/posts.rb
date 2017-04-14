# frozen_string_literal: true

FactoryGirl.define do
  factory :post do
    body { Faker::Lorem.paragraph }
    title { Faker::Hacker.say_something_smart }
    slug { title.parameterize }
    sticky false
    world_readable true
    author

    trait :sticky do
      sticky true
    end

    factory :sticky_post, traits: [:sticky]
  end
end
