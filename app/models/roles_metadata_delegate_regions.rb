# frozen_string_literal: true

class RolesMetadataDelegateRegions < ApplicationRecord
  enum :status, {
    senior_delegate: "senior_delegate",
    regional_delegate: "regional_delegate",
    delegate: "delegate",
    junior_delegate: "junior_delegate",
    trainee_delegate: "trainee_delegate",
  }

  # Placeholder start date given to every Delegate role that existed when roles were introduced
  # (see the AddDelegateRoles migration), so the real start date of those roles is unknown.
  MIGRATED_ROLE_START_DATE = Date.new(2004, 8, 1)

  has_one :user_role, as: :metadata
  has_one :group, through: :user_role
  has_one :user, through: :user_role
  has_one :delegate_region, through: :group, source: :metadata, source_type: "GroupsMetadataDelegateRegions"

  def senior_region
    group.root_group.name
  end

  # Start date of the latest continuous period as a junior Delegate. A region transfer ends the
  # old role on the new role's start date, so both roles count as one continuous period.
  # Returns nil when that period began before roles were introduced, as its real start is unknown.
  def junior_delegate_promotion_date
    promotion_date = user.roles
                         .select { |role| role.metadata.is_a?(RolesMetadataDelegateRegions) && role.metadata.junior_delegate? }
                         .sort_by(&:start_date)
                         .slice_when { |previous, current| previous.end_date && current.start_date > previous.end_date }
                         .to_a.last&.first&.start_date
    promotion_date unless promotion_date == MIGRATED_ROLE_START_DATE
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[senior_region junior_delegate_promotion_date],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
