# frozen_string_literal: true

class CreateGroupsMetadataTranslators < ActiveRecord::Migration[7.1]
  def change
    create_table :groups_metadata_translators do |t|
      t.string :locale
      t.timestamps
    end
  end
end
