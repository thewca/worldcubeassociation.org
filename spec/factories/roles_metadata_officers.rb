# frozen_string_literal: true

FactoryBot.define do
  factory :roles_metadata_officers do
    factory :executive_director_role_metadata do
      status { RolesMetadataOfficers.statuses[:executive_director] }
    end

    factory :chair_role_metadata do
      status { RolesMetadataOfficers.statuses[:chair] }
    end

    factory :vice_chair_role_metadata do
      status { RolesMetadataOfficers.statuses[:vice_chair] }
    end

    factory :secretary_role_metadata do
      status { RolesMetadataOfficers.statuses[:secretary] }
    end

    factory :treasurer_role_metadata do
      status { RolesMetadataOfficers.statuses[:treasurer] }
    end
  end
end
