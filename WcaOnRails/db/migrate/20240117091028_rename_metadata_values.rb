# frozen_string_literal: true

class RenameMetadataValues < ActiveRecord::Migration[7.1]
  def change
    UserGroup.translator_groups.each do |group|
      group.roles.each do |role|
        role.update!(metadata_type: "RolesMetadataTranslators")
      end
    end
  end
end
