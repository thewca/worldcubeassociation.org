# frozen_string_literal: true

after :user_groups do
  # Delegates on probation roles
  3.times { FactoryBot.create(:probation_role) }
  9.times { FactoryBot.create(:probation_role, :inactive) }

  # Delegate roles
  UserGroup.root_groups.delegate_regions.each do |group|
    # Senior Delegate
    FactoryBot.create(:senior_delegate_role, group: group)
    # Past Senior Delegates
    2.times { FactoryBot.create(:senior_delegate_role, :inactive, group: group) }

    if group.all_child_groups.any?
      group.all_child_groups.each do |child_group|
        # Regional Delegate
        FactoryBot.create(:regional_delegate_role, group: child_group)
        # Past Regional Delegates
        2.times { FactoryBot.create(:regional_delegate_role, :inactive, group: child_group) }
        # Delegates
        4.times { FactoryBot.create(:delegate_role, group: child_group) }
        3.times { FactoryBot.create(:junior_delegate_role, group: child_group) }
        2.times { FactoryBot.create(:trainee_delegate_role, group: child_group) }
        # Past Delegates
        12.times { FactoryBot.create(:delegate_role, :inactive, group: child_group) }
        9.times { FactoryBot.create(:junior_delegate_role, :inactive, group: child_group) }
        6.times { FactoryBot.create(:trainee_delegate_role, :inactive, group: child_group) }
      end
    else
      # Delegates
      4.times { FactoryBot.create(:delegate_role, group: group) }
      3.times { FactoryBot.create(:junior_delegate_role, group: group) }
      2.times { FactoryBot.create(:trainee_delegate_role, group: group) }
      # Past Delegates
      12.times { FactoryBot.create(:delegate_role, :inactive, group: group) }
      9.times { FactoryBot.create(:junior_delegate_role, :inactive, group: group) }
      6.times { FactoryBot.create(:trainee_delegate_role, :inactive, group: group) }
    end
  end

  # Teams & Committees
  UserGroup.teams_committees.each do |group|
    # Current roles
    leader = FactoryBot.create(:user_role, :active, group: group, metadata: FactoryBot.create(:roles_metadata_teams_committees, status: RolesMetadataTeamsCommittees.statuses[:leader]))
    leader.user.update_column(:email, "#{group.metadata.friendly_id}_team@valid.domain")
    3.times { FactoryBot.create(:user_role, :active, group: group, metadata: FactoryBot.create(:roles_metadata_teams_committees, status: RolesMetadataTeamsCommittees.statuses[:senior_member])) }
    5.times { FactoryBot.create(:user_role, :active, group: group, metadata: FactoryBot.create(:roles_metadata_teams_committees, status: RolesMetadataTeamsCommittees.statuses[:member])) }
    # Past roles
    3.times { FactoryBot.create(:user_role, :inactive, group: group, metadata: FactoryBot.create(:roles_metadata_teams_committees, status: RolesMetadataTeamsCommittees.statuses[:leader])) }
    9.times { FactoryBot.create(:user_role, :inactive, group: group, metadata: FactoryBot.create(:roles_metadata_teams_committees, status: RolesMetadataTeamsCommittees.statuses[:senior_member])) }
    15.times { FactoryBot.create(:user_role, :inactive, group: group, metadata: FactoryBot.create(:roles_metadata_teams_committees, status: RolesMetadataTeamsCommittees.statuses[:member])) }
  end

  # Board Roles
  past_board_roles = 9.times.collect { |index| FactoryBot.create(:board_role, :inactive) }
  current_board_roles = 4.times.collect { |index| FactoryBot.create(:board_role, :active) }

  # Officer Roles
  # Giving officer roles to all board users except past_board_roles[0] and current_board_roles[0]
  FactoryBot.create(:executive_director_role, :inactive, user: past_board_roles[1].user)
  FactoryBot.create(:executive_director_role, :inactive, user: past_board_roles[2].user)
  FactoryBot.create(:executive_director_role, user: current_board_roles[1].user)
  FactoryBot.create(:chair_role, :inactive, user: past_board_roles[2].user)
  FactoryBot.create(:chair_role, :inactive, user: past_board_roles[3].user)
  FactoryBot.create(:chair_role, user: current_board_roles[1].user)
  FactoryBot.create(:vice_chair_role, :inactive, user: past_board_roles[4].user)
  FactoryBot.create(:vice_chair_role, :inactive, user: past_board_roles[5].user)
  FactoryBot.create(:vice_chair_role, user: current_board_roles[2].user)
  FactoryBot.create(:secretary_role, :inactive, user: past_board_roles[6].user)
  FactoryBot.create(:secretary_role, :inactive, user: past_board_roles[7].user)
  FactoryBot.create(:secretary_role, user: current_board_roles[3].user)
  FactoryBot.create(:secretary_role)
  FactoryBot.create(:treasurer_role, :inactive, user: past_board_roles[8].user)
  FactoryBot.create(:treasurer_role, :inactive)
  FactoryBot.create(:treasurer_role)
end
