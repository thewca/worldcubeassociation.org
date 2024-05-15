# frozen_string_literal: true

class UserRole < ApplicationRecord
  belongs_to :user
  belongs_to :group, class_name: "UserGroup"
  belongs_to :metadata, polymorphic: true, optional: true

  delegate :group_type, to: :group

  scope :active, -> { where(end_date: nil).or(where.not(end_date: ..Date.today)) }

  STATUS_RANK = {
    UserGroup.group_types[:delegate_regions].to_sym => [
      RolesMetadataDelegateRegions.statuses[:trainee_delegate],
      RolesMetadataDelegateRegions.statuses[:junior_delegate],
      RolesMetadataDelegateRegions.statuses[:delegate],
      RolesMetadataDelegateRegions.statuses[:regional_delegate],
      RolesMetadataDelegateRegions.statuses[:senior_delegate],
    ],
    UserGroup.group_types[:teams_committees].to_sym => [
      RolesMetadataTeamsCommittees.statuses[:member],
      RolesMetadataTeamsCommittees.statuses[:senior_member],
      RolesMetadataTeamsCommittees.statuses[:leader],
    ],
    UserGroup.group_types[:councils].to_sym => [
      RolesMetadataCouncils.statuses[:member],
      RolesMetadataCouncils.statuses[:senior_member],
      RolesMetadataCouncils.statuses[:leader],
    ],
    UserGroup.group_types[:officers].to_sym => [
      RolesMetadataOfficers.statuses[:treasurer],
      RolesMetadataOfficers.statuses[:vice_chair],
      RolesMetadataOfficers.statuses[:secretary],
      RolesMetadataOfficers.statuses[:executive_director],
      RolesMetadataOfficers.statuses[:chair],
    ],
  }.freeze

  def self.status_rank(group_type, status)
    STATUS_RANK[group_type.to_sym]&.find_index(status) || STATUS_RANK[group_type.to_sym]&.length || 1
  end

  def status_rank
    status = metadata&.status || ''
    UserRole.status_rank(group_type, status)
  end

  def is_active?
    self.end_date.nil? || self.end_date > Date.today
  end

  def is_lead?
    status = metadata ? metadata[:status] : nil
    case group_type
    when UserGroup.group_types[:delegate_regions]
      ["senior_delegate", "regional_delegate"].include?(status)
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]
      ["leader"].include?(status)
    when UserGroup.group_types[:board], UserGroup.group_types[:officers]
      true # All board members & officers are considered as leads.
    else
      false
    end
  end

  def is_staff?
    case group_type
    when UserGroup.group_types[:delegate_regions]
      ["senior_delegate", "regional_delegate", "delegate", "junior_delegate"].include?(metadata.status)
    when UserGroup.group_types[:board], UserGroup.group_types[:officers], UserGroup.group_types[:teams_committees]
      true
    else
      false
    end
  end

  def is_eligible_voter?
    status = metadata&.status
    case group_type
    when UserGroup.group_types[:delegate_regions]
      ["senior_delegate", "regional_delegate", "delegate"].include?(status)
    when UserGroup.group_types[:teams_committees]
      ["leader", "senior_member"].include?(status)
    when UserGroup.group_types[:board], UserGroup.group_types[:officers]
      true # All board members & officers are considered as eligible voters.
    else
      false
    end
  end

  def discourse_user_group
    case group_type
    when UserGroup.group_types[:delegate_regions]
      metadata.status
    when UserGroup.group_types[:teams_committees], UserGroup.group_types[:councils]
      group.metadata.friendly_id
    when UserGroup.group_types[:board]
      UserGroup.group_types[:board]
    else
      nil
    end
  end

  def deprecated_team_role
    if group_type == UserGroup.group_types[:board]
      friendly_id = UserGroup.group_types[:board]
    else
      friendly_id = group.metadata.friendly_id
    end
    {
      id: self.id,
      friendly_id: friendly_id,
      leader: metadata&.status == "leader",
      senior_member: metadata&.status == "senior_member",
      name: user.name,
      wca_id: user.wca_id,
      avatar: user.avatar,
    }
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[],
    only: %w[id start_date end_date],
    include: %w[group user metadata],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json[:class] = self.class.to_s.downcase
    json
  end
end
