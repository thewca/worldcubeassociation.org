# frozen_string_literal: true

class AddDummyAccountMarkerToUsers < ActiveRecord::Migration[5.2]
  def up
    add_column :users, :dummy_account, :boolean, null: false, default: false
    User.where("wca_id != '' AND encrypted_password = '' AND email LIKE '%@worldcubeassociation.org'")
        .update_all("dummy_account = 1, email = CONCAT(wca_id, '@dummy.worldcubeassociation.org')")
  end

  def down
    remove_column :users, :dummy_account
    User.where("wca_id != '' AND encrypted_password = '' AND email = ''")
        .update_all("email = CONCAT(wca_id, '@worldcubeassociation.org')")
  end
end
