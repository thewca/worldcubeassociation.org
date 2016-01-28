FactoryGirl.define do
  factory :user, aliases: [:author] do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    country_iso2 "US"
    gender "m"
    dob Date.new(1980, 1, 1)
    password "wca"
    password_confirmation { "wca" }
    before(:create) { |user| user.skip_confirmation! }

    factory :admin do
      name "Mr. Admin"
      email "admin@worldcubeassociation.org"
      software_team true
    end

    factory :results_team do
      results_team true
    end

    factory :wrc_team do
      wrc_team true
    end

    trait :wca_id do
      wca_id { FactoryGirl.create(:person, name: name).id }
    end

    factory :user_with_wca_id, traits: [:wca_id]

    factory :delegate, traits: [:wca_id] do
      delegate_status "delegate"
    end

    factory :candidate_delegate, traits: [:wca_id] do
      delegate_status "delegate"
    end

    factory :senior_delegate, traits: [:wca_id] do
      delegate_status "senior_delegate"
    end

    factory :board_member, traits: [:wca_id] do
      delegate_status "board_member"
    end

    factory :dummy_user, traits: [:wca_id] do
      encrypted_password ""
      after(:create) do |user|
        user.update_column(:email, "#{user.wca_id}@worldcubeassociation.org")
      end
    end
  end
end
