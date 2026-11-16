# frozen_string_literal: true

class WcaMonthlyDigest
  DELEGATE_STATUSES = RolesMetadataDelegateRegions.statuses
  TEAM_STATUSES = RolesMetadataTeamsCommittees.statuses

  RoleChange = Data.define(:user, :role_before, :role_after) do
    def status_before
      role_before.metadata.status if role_before.present?
    end

    def status_after
      role_after.metadata.status if role_after.present?
    end

    def changed_status?(status_from, status_to)
      status_before == status_from && status_after == status_to
    end

    def became?(status)
      status_after == status && status_before != status
    end

    def stopped_being?(status)
      status_before == status && status_after != status
    end

    def demoted?
      role_before.present? && role_after.present? && role_after.status_rank < role_before.status_rank
    end

    def group
      (role_after || role_before).group
    end

    def location
      (role_after || role_before).metadata.location
    end
  end

  attr_reader :period

  def initialize(period = Date.today.prev_month.all_month)
    @period = period
  end

  def leader_changes
    team_changes.filter_map do |change|
      leader_title = "#{change.group.name} Leader"

      if change.became?(TEAM_STATUSES[:leader])
        "#{change.user.name} was appointed as the new #{leader_title}."
      elsif change.stopped_being?(TEAM_STATUSES[:leader])
        continuation = change.status_after.present? ? "but will continue as #{status_name(change.role_after)}" : "and is no longer a member"
        "#{change.user.name} is no longer the #{leader_title}, #{continuation}."
      end
    end
  end

  def new_senior_delegates
    delegate_changes.filter { it.became?(DELEGATE_STATUSES[:senior_delegate]) }
                    .map { "#{it.user.name} - #{it.group.name}" }
  end

  def new_regional_delegates
    delegate_changes.filter { it.became?(DELEGATE_STATUSES[:regional_delegate]) }.map do |change|
      region = change.role_after.group
      predecessor = delegate_changes.find { it.stopped_being?(DELEGATE_STATUSES[:regional_delegate]) && it.role_before.group_id == region.id }
      stepped_down_note = ", as #{predecessor.user.name} stepped down from this role" if predecessor.present?

      "#{change.user.name} has been appointed as the new Regional Delegate for the #{region.name} region#{stepped_down_note}."
    end
  end

  def new_trainee_delegates
    new_delegates_with_status(DELEGATE_STATUSES[:trainee_delegate])
  end

  def new_junior_delegates
    new_delegates_with_status(DELEGATE_STATUSES[:junior_delegate])
  end

  def trainee_to_junior_delegate_promotions
    delegate_promotions(DELEGATE_STATUSES[:trainee_delegate], DELEGATE_STATUSES[:junior_delegate])
  end

  def junior_delegate_to_delegate_promotions
    delegate_promotions(DELEGATE_STATUSES[:junior_delegate], DELEGATE_STATUSES[:delegate])
  end

  def delegate_resignations_and_demotions
    resigned_changes = delegate_changes.filter { it.role_before.present? && it.role_after.nil? }
    delegated_competitions_counts = User.joins(:actually_delegated_competitions)
                                        .where(id: resigned_changes.map { it.user.id })
                                        .group("users.id")
                                        .count

    delegate_changes.filter_map do |change|
      if resigned_changes.include?(change)
        "#{name_and_location(change)}, #{delegated_competitions_counts.fetch(change.user.id, 0)} delegated competitions"
      # Senior and Regional Delegates stepping down from their lead role remain Delegates, so they aren't listed.
      elsif change.demoted? && !change.role_before.lead?
        "#{name_and_location(change)}, demoted to #{status_name(change.role_after)}"
      end
    end
  end

  def new_team_members
    team_changes.filter { it.role_before.nil? && TEAM_STATUSES.values_at(:member, :senior_member).include?(it.status_after) }.map do |change|
      senior_member_note = " (#{status_name(change.role_after)})" if change.status_after == TEAM_STATUSES[:senior_member]
      "#{change.user.name}, #{change.group.name}#{senior_member_note}"
    end
  end

  def promoted_team_members
    team_changes.filter { it.changed_status?(TEAM_STATUSES[:member], TEAM_STATUSES[:senior_member]) }
                .map { "#{it.user.name}, #{it.group.name}" }
  end

  def team_member_resignations_and_demotions
    team_changes.filter_map do |change|
      next if change.status_before == TEAM_STATUSES[:leader]

      if change.role_before.present? && change.role_after.nil?
        "#{change.user.name}, #{change.group.name}"
      elsif change.demoted?
        "#{change.user.name}, #{change.group.name}, demoted to #{status_name(change.role_after)}"
      end
    end
  end

  def recognized_regional_organizations
    RegionalOrganization.where(start_date: period)
                        .order(:name)
                        .map { "#{it.name}, #{it.country}" }
  end

  private

    def delegate_changes
      # A Delegate moving to another region keeps their status, so their roles are compared across all regions.
      @delegate_changes ||= role_changes(UserGroup.delegate_regions, &:user_id)
    end

    def team_changes
      @team_changes ||= role_changes(UserGroup.teams_committees.or(UserGroup.councils)) { [it.user_id, it.group_id] }
    end

    def role_changes(groups, &)
      roles_in_groups = UserRole.where(group: groups)
      changed_user_ids = roles_in_groups.where(start_date: period)
                                        .or(roles_in_groups.where(end_date: period))
                                        .distinct
                                        .pluck(:user_id)

      roles_in_groups.where(user_id: changed_user_ids)
                     .includes(:user, :group, :metadata)
                     .group_by(&)
                     .values
                     .map { RoleChange.new(user: it.first.user, role_before: highest_role_on(it, period.begin.prev_day), role_after: highest_role_on(it, period.end)) }
                     .reject { it.role_before.nil? && it.role_after.nil? }
                     .sort_by { [it.user.name, it.group.name] }
    end

    def highest_role_on(roles, date)
      roles.filter { it.active_on?(date) }.max_by(&:status_rank)
    end

    def new_delegates_with_status(status)
      delegate_changes.filter { it.role_before.nil? && it.status_after == status }
                      .map { "#{it.user.name} (#{it.user.wca_id}), #{it.location}" }
    end

    def delegate_promotions(status_from, status_to)
      delegate_changes.filter { it.changed_status?(status_from, status_to) }
                      .map { name_and_location(it) }
    end

    def name_and_location(change)
      "#{change.user.name}, #{change.location}"
    end

    def status_name(role)
      I18n.t("enums.user_roles.status.#{role.group_type}.#{role.metadata.status}", locale: :en)
    end
end
