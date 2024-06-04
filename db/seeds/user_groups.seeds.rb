# frozen_string_literal: true

after :groups_metadata_board, :groups_metadata_councils, :groups_metadata_teams_committees, :groups_metadata_delegate_regions do
  # Delegate Regions
  UserGroup.create!(
    name: 'Africa',
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa'),
  )
  asia_group = UserGroup.create!(
    name: 'Asia',
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia'),
  )
  europe_group = UserGroup.create!(
    name: 'Europe',
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe'),
  )
  oceania_group = UserGroup.create!(
    name: 'Oceania',
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'oceania'),
  )
  UserGroup.create!(
    name: 'Americas',
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'americas'),
  )
  UserGroup.create!(
    name: 'North America',
    group_type: :delegate_regions,
    is_active: false,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'north-america'),
  )
  UserGroup.create!(
    name: 'South America',
    group_type: :delegate_regions,
    is_active: false,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'south-america'),
  )
  UserGroup.create!(
    name: 'Asia East',
    parent_group: asia_group,
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia-east'),
  )
  asia_west_group = UserGroup.create!(
    name: 'Asia West',
    parent_group: asia_group,
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia-west'),
  )
  UserGroup.create!(
    name: 'India',
    parent_group: asia_west_group,
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'india'),
  )
  UserGroup.create!(
    name: 'Europe North',
    parent_group: europe_group,
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe-north'),
  )
  UserGroup.create!(
    name: 'Europe South',
    parent_group: europe_group,
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe-south'),
  )
  UserGroup.create!(
    name: 'Australia',
    parent_group: oceania_group,
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'australia'),
  )
  UserGroup.create!(
    name: 'New Zealand',
    parent_group: oceania_group,
    group_type: :delegate_regions,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataDelegateRegions.find_by!(friendly_id: 'new-zealand'),
  )

  # Board
  UserGroup.create!(
    name: 'WCA Board of Directors',
    group_type: :board,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataBoard.find_by!(email: 'board@worldcubeassociation.org'),
  )

  # Officers
  UserGroup.create!(
    name: 'WCA Officers',
    group_type: :officers,
    is_active: true,
    is_hidden: false,
  )

  # Councils
  UserGroup.create!(
    name: 'WCA Advisory Council',
    group_type: :councils,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataCouncils.find_by!(friendly_id: 'wac'),
  )

  # Teams/Committees
  UserGroup.create!(
    name: 'WCA Communications Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wct'),
  )
  UserGroup.create!(
    name: 'WCA Results Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wrt'),
  )
  UserGroup.create!(
    name: 'WCA Software Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wst'),
  )
  UserGroup.create!(
    name: 'WCA Executive Assistants Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'weat'),
  )
  UserGroup.create!(
    name: 'WCA Finance Committee',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wfc'),
  )
  UserGroup.create!(
    name: 'WCA Competitions Announcement Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wcat'),
  )
  UserGroup.create!(
    name: 'WCA Disciplinary Committee',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wdc'),
  )
  UserGroup.create!(
    name: 'WCA Ethics Committee',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wec'),
  )
  UserGroup.create!(
    name: 'WCA Marketing Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wmt'),
  )
  UserGroup.create!(
    name: 'WCA Quality Assurance Committee',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wqac'),
  )
  UserGroup.create!(
    name: 'WCA Regulations Committee',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wrc'),
  )
  UserGroup.create!(
    name: 'WCA Sports Organization Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wsot'),
  )
  UserGroup.create!(
    name: 'WCA Archive Team',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wat'),
  )
  UserGroup.create!(
    name: 'WCA Software Admin',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: true,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wst_admin'),
  )
  UserGroup.create!(
    name: 'WCT China',
    group_type: :teams_committees,
    is_active: true,
    is_hidden: true,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wct_china'),
  )
  UserGroup.create!(
    name: 'WCA Data Protection Committee',
    group_type: :teams_committees,
    is_active: false,
    is_hidden: false,
    metadata: GroupsMetadataTeamsCommittees.find_by!(friendly_id: 'wdpc'),
  )

  # Translators
  UserGroup.create!(
    name: 'Català',
    group_type: :translators,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTranslators.find_by!(locale: 'ca'),
  )
  UserGroup.create!(
    name: 'Čeština',
    group_type: :translators,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTranslators.find_by!(locale: 'cs'),
  )
  UserGroup.create!(
    name: 'Dansk',
    group_type: :translators,
    is_active: true,
    is_hidden: false,
    metadata: GroupsMetadataTranslators.find_by!(locale: 'da'),
  )

  # Delegate Probation
  UserGroup.create!(
    name: 'Delegate Probation',
    group_type: :delegate_probation,
    is_active: true,
    is_hidden: true,
  )

  # Banned Competitors
  UserGroup.create!(
    name: 'Banned Competitors',
    group_type: :banned_competitors,
    is_active: true,
    is_hidden: true,
  )
end
