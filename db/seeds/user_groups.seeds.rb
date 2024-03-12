# frozen_string_literal: true

UserGroup.create!(
  name: 'WCA Board of Directors',
  group_type: :board,
  is_active: true,
  is_hidden: false,
  metadata: GroupsMetadataBoard.create!(email: 'board@worldcubeassociation.org'),
)
