# frozen_string_literal: true
FactoryGirl.define do
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
        software_team = Team.find_by_friendly_id('software')
        FactoryGirl.create(:team_member, team_id: software_team.id, user_id: user.id, team_leader: true)
      end
    end

    factory :results_team do
      after(:create) do |user|
        results_team = Team.find_by_friendly_id('results')
        FactoryGirl.create(:team_member, team_id: results_team.id, user_id: user.id)
      end
    end

    factory :wrc_team do
      after(:create) do |user|
        wrc_team = Team.find_by_friendly_id('wrc')
        FactoryGirl.create(:team_member, team_id: wrc_team.id, user_id: user.id)
      end
    end

    trait :wca_id do
      transient do
        person { FactoryGirl.create(:person, name: name, countryId: Country.find_by_iso2(country_iso2).id, gender: gender, dob: dob.strftime("%F")) }
      end
      wca_id { person.wca_id }
    end

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
