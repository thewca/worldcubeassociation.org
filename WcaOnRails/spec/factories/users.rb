FactoryGirl.define do
  factory :user, aliases: [:author] do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    password "foo"
    password_confirmation { "foo" }
    after(:create) { |user| user.confirm! }

    factory :admin do
      name "Mr. Admin"
      email "admin@worldcubeassociation.org"
      software_admin_team true
    end

    factory :results_team do
      results_team true
    end

    factory :wrc_team do
      wrc_team true
    end

    factory :user_with_wca_id do
      wca_id { FactoryGirl.create(:person, name: name).id }

      factory :delegate do
        delegate_status "delegate"
      end

      factory :board_member do
        delegate_status "board_member"
      end

      factory :dummy_user do
        encrypted_password ""
        after(:create) do |user|
          user.update_column(:email, "#{user.wca_id}@worldcubeassociation.org")
        end
      end
    end
  end
end
