FactoryGirl.define do
  factory :field_data_body do
    body_value { Faker::Lorem.paragraph }
    delta 1
    entity_type "node"
    node
  end

  factory :node do
    type "story"
    promote true
    created { Time.now.to_i }
    title { Faker::Lorem.sentence }
    author
  end

  factory :user, aliases: [:author] do
    name { Faker::Name.name }
  end

  factory :url_alias do
  end
end
