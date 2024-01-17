# frozen_string_literal: true

class RenameGroupsMetadataTranslatorsToRolesMetadataTranslators < ActiveRecord::Migration[7.1]
  def change
    rename_table :groups_metadata_translators, :roles_metadata_translators
  end
end
