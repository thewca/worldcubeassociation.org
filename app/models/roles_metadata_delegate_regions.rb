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

  # A Delegate role change ends the current role and starts a new one, so the metadata
  # describing the change is the one of the ended role and still holds the previous status.
  def promoted_from_trainee?(changes)
    trainee_delegate? && changes.any? { |change| change['changed_parameter'] == 'Status' }
  end
end
