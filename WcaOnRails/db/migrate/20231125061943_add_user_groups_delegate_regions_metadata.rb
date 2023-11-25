# frozen_string_literal: true

class AddUserGroupsDelegateRegionsMetadata < ActiveRecord::Migration[7.0]
  def change
    UserGroup.find_by(name: "Africa").update!(
      metadata: UserGroupsDelegateRegionsMetadata.create!(
        email: "delegates.africa@worldcubeassociation.org",
      ),
    )
    UserGroup.find_by(name: "Asia East").update!(
      metadata: UserGroupsDelegateRegionsMetadata.create!(
        email: "delegates.asia-east@worldcubeassociation.org",
      ),
    )
    UserGroup.find_by(name: "Asia Southeast").update!(
      metadata: UserGroupsDelegateRegionsMetadata.create!(
        email: "delegates.asia-southeast@worldcubeassociation.org",
      ),
    )
    UserGroup.find_by(name: "Asia West & South").update!(
      metadata: UserGroupsDelegateRegionsMetadata.create!(
        email: "delegates.asia-west-south@worldcubeassociation.org",
      ),
    )
    UserGroup.find_by(name: "Central Eurasia").update!(
      metadata: UserGroupsDelegateRegionsMetadata.create!(
        email: "delegates.central-eurasia@worldcubeassociation.org",
      ),
    )
    UserGroup.find_by(name: "Europe").update!(
      metadata: UserGroupsDelegateRegionsMetadata.create!(
        email: "delegates.europe@worldcubeassociation.org",
      ),
    )
    UserGroup.find_by(name: "Latin America").update!(
      metadata: UserGroupsDelegateRegionsMetadata.create!(
        email: "delegates.latin-america@worldcubeassociation.org",
      ),
    )
    UserGroup.find_by(name: "Oceania").update!(
      metadata: UserGroupsDelegateRegionsMetadata.create!(
        email: "delegates.oceania@worldcubeassociation.org",
      ),
    )
    UserGroup.find_by(name: "USA & Canada").update!(
      metadata: UserGroupsDelegateRegionsMetadata.create!(
        email: "delegates.usa-canada@worldcubeassociation.org",
      ),
    )
  end
end
