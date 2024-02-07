# frozen_string_literal: true

FactoryBot.define do
  factory :roles_metadata_delegate_regions do
    factory :senior_delegate_role_metadata do
      status { "senior_delegate" }
    end
  end
end
