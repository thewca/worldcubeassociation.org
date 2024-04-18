# frozen_string_literal: true

FactoryBot.define do
  factory :roles_metadata_teams_committees do
    factory :wst_admin_metadata do
      status { "member" }
    end

    factory :wct_china_metadata do
      status { "member" }
    end
  end
end
