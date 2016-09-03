# frozen_string_literal: true
FactoryGirl.define do
  factory :user, aliases: [:author] do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    country_iso2 { Country.all_real.sample.iso2 }
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
        software_team = Team.find_by_slug('software-team') || FactoryGirl.create(:team, name: 'Software Team', committee: Committee.find_by_slug(Committee::WCA_SOFTWARE_COMMITTEE))
        FactoryGirl.create(:team_member, team: software_team, user: user)
      end
    end

    factory :admin_demoted do
      name "Mr. Admin"
      email "admin@worldcubeassociation.org"
      after(:create) do |user|
        software_team = Team.find_by_slug('software-team') || FactoryGirl.create(:team, name: 'Software Team', committee: Committee.find_by_slug(Committee::WCA_SOFTWARE_COMMITTEE))
        FactoryGirl.create(:team_member, :demoted, team: software_team, user: user)
      end
    end

    factory :results_team_member do
      after(:create) do |user|
        results_team = Team.find_by_slug('results-team') || FactoryGirl.create(:team, name: 'Results Team', committee: Committee.find_by_slug(Committee::WCA_RESULTS_COMMITTEE))
        FactoryGirl.create(:team_member, team: results_team, user: user)
      end
    end

    factory :regulations_team_member do
      after(:create) do |user|
        regulations_team = Team.find_by_slug('regulations-team') || FactoryGirl.create(:team, name: 'Regulations Team', committee: Committee.find_by_slug(Committee::WCA_REGULATIONS_COMMITTEE))
        FactoryGirl.create(:team_member, team: regulations_team, user: user)
      end
    end

    factory :disciplinary_team_member do
      after(:create) do |user|
        disciplinary_team = Team.find_by_slug('disciplinary-team') || FactoryGirl.create(:team, name: 'Disciplinary Team', committee: Committee.find_by_slug(Committee::WCA_DISCIPLINARY_COMMITTEE))
        FactoryGirl.create(:team_member, team: disciplinary_team, user: user)
      end
    end

    trait :wca_id do
      transient do
        person { FactoryGirl.create(:person, name: name, countryId: Country.find_by_iso2(country_iso2).id, gender: gender, dob: dob.strftime("%F")) }
      end
      wca_id { person.wca_id }
    end

    factory :user_with_wca_id, traits: [:wca_id]

    factory :candidate_delegate, traits: [:wca_id] do
      after(:create) do |user|
        FactoryGirl.create(:team_member, :senior_delegate)
        FactoryGirl.create(:team_member, :candidate_delegate, user: user)
      end
    end

    factory :delegate, traits: [:wca_id] do
      transient do
        start_date 1.year.ago
      end
      after(:create) do |user, dates|
        FactoryGirl.create(:team_member, :senior_delegate)
        FactoryGirl.create(:team_member, :delegate, user: user, start_date: dates.start_date)
      end
    end

    factory :senior_delegate, traits: [:wca_id] do
      after(:create) do |user|
        FactoryGirl.create(:team_member, :senior_delegate, user: user)
      end
    end

    factory :board_member, traits: [:wca_id] do
      after(:create) do |user|
        FactoryGirl.create(:team_member, :board_member, user: user)
      end
    end

    factory :software_team_leader, traits: [:wca_id] do
      after(:create) do |user|
        FactoryGirl.create(:team_member, :software_team_leader, user: user)
      end
    end

    factory :results_team_leader, traits: [:wca_id] do
      after(:create) do |user|
        FactoryGirl.create(:team_member, :results_team_leader, user: user)
      end
    end

    factory :regulations_team_leader, traits: [:wca_id] do
      after(:create) do |user|
        FactoryGirl.create(:team_member, :regulations_team_leader, user: user)
      end
    end

    factory :disciplinary_team_leader, traits: [:wca_id] do
      after(:create) do |user|
        FactoryGirl.create(:team_member, :disciplinary_team_leader, user: user)
      end
    end

    factory :dummy_user, traits: [:wca_id] do
      encrypted_password ""
      after(:create) do |user|
        user.update_column(:email, "#{user.wca_id}@worldcubeassociation.org")
      end
    end
  end
end
