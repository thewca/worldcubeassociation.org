# frozen_string_literal: true

FactoryBot.define do
  factory :post do
    body { Faker::Lorem.paragraph }
    title { Faker::Hacker.say_something_smart }
    slug { title.parameterize }
    sticky { false }
    show_on_homepage { true }
    author

    trait :sticky do
      sticky { true }
    end

    factory :sticky_post, traits: [:sticky]
  end
end
