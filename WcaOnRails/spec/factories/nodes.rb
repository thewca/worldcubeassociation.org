FactoryGirl.define do
  factory :node do
    type "story"
    promote true
    created { Time.now.to_i }
    title { Faker::Lorem.sentence }
  end

  factory :user do
    name { Faker::Name.name }
  end

  factory :field_data_body do
    body_value { Faker::Lorem.paragraph }
    delta 1
  end

  factory :url_alias do
  end
end
