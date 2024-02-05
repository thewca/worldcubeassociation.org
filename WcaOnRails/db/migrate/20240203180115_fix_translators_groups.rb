# frozen_string_literal: true

class FixTranslatorsGroups < ActiveRecord::Migration[7.1]
  def change
    existing_translators_group = UserGroup.find_by(group_type: UserGroup.group_types[:translators])
    translators = UserRole.where(group_id: existing_translators_group.id)
    group_name_suffix = " Translators"
    translators.each do |translator|
      locale = translator.metadata[:locale]
      if UserGroup.find_by(name: locale + group_name_suffix).nil?
        group = UserGroup.create!(name: locale + group_name_suffix, group_type: UserGroup.group_types[:translators], is_active: true, is_hidden: true)
        group.metadata = GroupsMetadataTranslators.create!(locale: locale)
        group.save!
      else
        group = UserGroup.find_by(name: locale + group_name_suffix)
      end
      translator.metadata.delete
      translator.update!(group_id: group.id, metadata: nil)
    end
    existing_translators_group.delete
  end
end
