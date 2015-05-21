FactoryGirl.define do
  factory :devise_user, aliases: [:author] do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    password "foo"
    password_confirmation { "foo" }
    after(:create) { |user| user.confirm! }
  end
end
