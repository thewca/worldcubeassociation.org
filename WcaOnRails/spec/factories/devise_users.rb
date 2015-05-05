FactoryGirl.define do
  factory :devise_user do
    email "jin@champloo.com"
    password "12345678"
    password_confirmation { "12345678" }
    after(:create) { |user| user.confirm! }
  end
end
