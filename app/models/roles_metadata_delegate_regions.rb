# frozen_string_literal: true

class RolesMetadataDelegateRegions < ApplicationRecord
  enum :status, {
    senior_delegate: "senior_delegate",
    regional_delegate: "regional_delegate",
    delegate: "delegate",
    junior_delegate: "junior_delegate",
    trainee_delegate: "trainee_delegate",
  }

  has_one :user_role, as: :metadata
  has_one :group, through: :user_role
  has_one :user, through: :user_role
  has_one :delegate_region, through: :group, source: :metadata, source_type: "GroupsMetadataDelegateRegions"
end
