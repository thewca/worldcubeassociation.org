# frozen_string_literal: true

after :groups_metadata_board, :groups_metadata_councils, :groups_metadata_teams_committees do
  board_metadata = GroupsMetadataBoard.find_by!(email: 'board@worldcubeassociation.org')
  UserGroup.create!(
    name: 'WCA Board of Directors',
    group_type: :board,
    is_active: true,
    is_hidden: false,
    metadata: board_metadata,
  )
  councils_metadata = GroupsMetadataCouncils.find_by!(friendly_id: 'wac')
  UserGroup.create!(
    name: 'WCA Advisory Council',
    group_type: :councils,
    is_active: true,
    is_hidden: false,
    metadata: councils_metadata,
  )
  wct_metadata = GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wct')
  UserGroup.create!(
    name: 'WCA Communications Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: wct_metadata,
  )
  wrt_metadata = GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wrt')
  UserGroup.create!(
    name: 'WCA Results Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: wrt_metadata,
  )
  wst_metadata = GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wst')
  UserGroup.create!(
    name: 'WCA Software Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: wst_metadata,
  )
  weat_metadata = GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'weat')
  UserGroup.create!(
    name: 'WCA Executive Assistants Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: weat_metadata,
  )
  wfc_metadata = GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wfc')
  UserGroup.create!(
    name: 'WCA Finance Committee',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: wfc_metadata,
  )
end
