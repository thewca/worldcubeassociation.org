FactoryGirl.define do
  factory :user, aliases: [:author] do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    password "foo"
    password_confirmation { "foo" }
    after(:create) { |user| user.confirm! }
  end

  factory :admin, class: User do
    name "Mr. Admin"
    email "admin@worldcubeassociation.org"
    password "foo"
    password_confirmation { "foo" }
    admin true
    after(:create) { |user| user.confirm! }
  end
end
