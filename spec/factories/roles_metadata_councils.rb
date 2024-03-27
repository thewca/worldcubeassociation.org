# frozen_string_literal: true

FactoryBot.define do
  factory :roles_metadata_councils do
    factory :wac_role_metadata do
      status { "leader" }
    end
  end
end
