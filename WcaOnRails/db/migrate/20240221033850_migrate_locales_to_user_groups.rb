# frozen_string_literal: true

class MigrateLocalesToUserGroups < ActiveRecord::Migration[7.1]
  def change
    metadata = GroupsMetadataTranslators.create!(locale: 'en')
    UserGroup.create(name: 'English', group_type: UserGroup.group_types[:translators], is_active: true, is_hidden: true, metadata: metadata)
    Locales::AVAILABLE.each_key do |locale_key|
      locale = Locales::AVAILABLE[locale_key.to_sym]
      group_metadata = GroupsMetadataTranslators.find_by(locale: locale_key)
      group = UserGroup.find_by(metadata_id: group_metadata.id)
      group.update(name: locale[:name]) if group.present?
    end
  end
end
