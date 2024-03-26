# frozen_string_literal: true

after :groups_metadata_board, :groups_metadata_councils do
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
end
