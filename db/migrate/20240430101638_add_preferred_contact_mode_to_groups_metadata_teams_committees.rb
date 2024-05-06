# frozen_string_literal: true

class AddPreferredContactModeToGroupsMetadataTeamsCommittees < ActiveRecord::Migration[7.1]
  def change
    add_column :groups_metadata_teams_committees, :preferred_contact_mode, :string, null: false
    change_column_default :groups_metadata_teams_committees, :preferred_contact_mode, GroupsMetadataTeamsCommittees.preferred_contact_modes[:email]
    UserGroup.teams_committees_group_wrt.metadata.update!(preferred_contact_mode: GroupsMetadataTeamsCommittees.preferred_contact_modes[:contact_form])
    UserGroup.teams_committees_group_wct.metadata.update!(preferred_contact_mode: GroupsMetadataTeamsCommittees.preferred_contact_modes[:contact_form])
    UserGroup.teams_committees_group_wcat.metadata.update!(preferred_contact_mode: GroupsMetadataTeamsCommittees.preferred_contact_modes[:no_contact])
  end
end
