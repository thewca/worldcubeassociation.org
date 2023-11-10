# frozen_string_literal: true

FactoryBot.define do
  factory :user, aliases: [:author] do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    country_iso2 { Country.real.sample.iso2 }
    gender { "m" }
    dob { Date.new(1980, 1, 1) }
    password { "wca" }
    password_confirmation { "wca" }
    cookies_acknowledged { true }

    transient do
      preferred_event_ids { [] }
    end
    # Using accept_nested_attributes_for
    user_preferred_events_attributes do
      preferred_event_ids.map do |event_id|
        { event_id: event_id }
      end
    end

    transient do
      confirmed { true }
    end
    before(:create) do |user, options|
      user.skip_confirmation! if options.confirmed
    end

    factory :admin do
      name { "Mr. Admin" }
      email { "admin@worldcubeassociation.org" }
      after(:create) do |user|
        software_admin_team = Rails.env.production? ? Team.wst_admin : Team.wst
        FactoryBot.create(:team_member, team_id: software_admin_team.id, user_id: user.id, team_leader: true)
      end
    end

    transient do
      team_leader { false }
    end

    transient do
      team_senior_member { false }
    end

    trait :board_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.board.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :chair do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.chair.id, user_id: user.id)
      end
    end

    trait :executive_director do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.executive_director.id, user_id: user.id)
      end
    end

    trait :secretary do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.secretary.id, user_id: user.id)
      end
    end

    trait :vice_chair do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.vice_chair.id, user_id: user.id)
      end
    end

    trait :wrt_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wrt.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wdc_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wdc.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wdpc_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wdpc.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wdc_leader do
      after(:create) do |user|
        FactoryBot.create(:team_member, team_id: Team.wdc.id, user_id: user.id, team_leader: true)
      end
    end

    trait :banned do
      after(:create) do |user|
        FactoryBot.create(:team_member, team_id: Team.banned.id, user_id: user.id)
      end
    end

    trait :wrc_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wrc.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wct_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wct.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wct_china_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wct_china.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wqac_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wqac.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wcat_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wcat.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wec_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wec.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :weat_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.weat.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wfc_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wfc.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wmt_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wmt.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wst_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wst.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wst_admin_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wst_admin.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wac_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wac.id, user_id: user.id, team_leader: options.team_leader)
      end
    end

    trait :wsot_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wsot.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wat_member do
      after(:create) do |user, options|
        FactoryBot.create(:team_member, team_id: Team.wat.id, user_id: user.id, team_senior_member: options.team_senior_member, team_leader: options.team_leader)
      end
    end

    trait :wca_id do
      transient do
        person { FactoryBot.create(:person, name: name, countryId: Country.find_by_iso2(country_iso2).id, gender: gender, dob: dob.strftime("%F")) }
      end
    end

    trait :with_2fa do
      otp_required_for_login { true }
      otp_secret { User.generate_otp_secret }
    end

    wca_id { person&.wca_id }

    after(:build) do |user|
      if user.person
        user.name = user.person.name
        user.country_iso2 = user.person.country_iso2
        user.dob = user.person.dob
        user.gender = user.person.gender
      end
    end

    trait :french_locale do
      after(:create) do |user|
        user.preferred_locale = :fr
      end
    end

    factory :user_with_wca_id, traits: [:wca_id]

    factory :delegate, traits: [:wca_id] do
      association :senior_delegate
      delegate_status { "delegate" }
      region_id { FactoryBot.create(:africa_region).id }
    end

    factory :candidate_delegate, traits: [:wca_id] do
      association :senior_delegate
      delegate_status { "candidate_delegate" }
      region_id { FactoryBot.create(:africa_region).id }
    end

    factory :trainee_delegate, traits: [:wca_id] do
      association :senior_delegate
      delegate_status { "trainee_delegate" }
      region_id { FactoryBot.create(:africa_region).id }
    end

    factory :senior_delegate, traits: [:wca_id] do
      delegate_status { "senior_delegate" }
      region_id { FactoryBot.create(:africa_region).id }
    end

    factory :dummy_user, traits: [:wca_id] do
      encrypted_password { "" }
      dummy_account { true }
    end
  end
end
