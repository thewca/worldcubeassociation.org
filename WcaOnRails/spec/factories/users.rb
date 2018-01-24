# frozen_string_literal: true

FactoryBot.define do
  factory :user, aliases: [:author] do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    country_iso2 { Country.real.sample.iso2 }
    gender "m"
    dob Date.new(1980, 1, 1)
    password "wca"
    password_confirmation { "wca" }

    transient do
      preferred_event_ids []
    end
    # Using accept_nested_attributes_for
    user_preferred_events_attributes do
      preferred_event_ids.map do |event_id|
        { event_id: event_id }
      end
    end

    before(:create) { |user| user.skip_confirmation! }
    trait :unconfirmed do
      before(:create) { |user| user.confirmed_at = nil }
    end

    factory :admin do
      name "Mr. Admin"
      email "admin@worldcubeassociation.org"
      after(:create) do |user|
        software_team = Team.wst
        FactoryBot.create(:team_member, team_id: software_team.id, user_id: user.id, team_leader: true)
      end
    end

    trait :board_member do
      after(:create) do |user|
        FactoryBot.create(:team_member, team_id: Team.board.id, user_id: user.id)
      end
    end

    trait :wrt_member do
      after(:create) do |user|
        FactoryBot.create(:team_member, team_id: Team.wrt.id, user_id: user.id)
      end
    end

    trait :wdc_member do
      after(:create) do |user|
        FactoryBot.create(:team_member, team_id: Team.wdc.id, user_id: user.id)
      end
    end

    trait :wrc_member do
      after(:create) do |user|
        FactoryBot.create(:team_member, team_id: Team.wrc.id, user_id: user.id)
      end
    end

    trait :wct_member do
      after(:create) do |user|
        FactoryBot.create(:team_member, team_id: Team.wct.id, user_id: user.id)
      end
    end

    trait :wca_id do
      transient do
        person { FactoryBot.create(:person, name: name, countryId: Country.find_by_iso2(country_iso2).id, gender: gender, dob: dob.strftime("%F")) }
      end
    end

    trait :french_locale do
      after(:create) do |user|
        user.preferred_locale = :fr
      end
    end

    wca_id { person&.wca_id }

    factory :user_with_wca_id, traits: [:wca_id]

    factory :delegate, traits: [:wca_id] do
      delegate_status "delegate"
    end

    factory :candidate_delegate, traits: [:wca_id] do
      delegate_status "candidate_delegate"
    end

    factory :senior_delegate, traits: [:wca_id] do
      delegate_status "senior_delegate"
    end

    factory :dummy_user, traits: [:wca_id] do
      encrypted_password ""
      after(:create) do |user|
        user.update_column(:email, "#{user.wca_id}@worldcubeassociation.org")
      end
    end
  end
end
