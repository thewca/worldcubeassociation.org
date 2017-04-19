# frozen_string_literal: true

class OrganisationToOrganization < ActiveRecord::Migration
  def up
    rename_column :delegate_reports, :organisation, :organization
  end

  def down
    rename_column :delegate_reports, :organization, :organisation
  end
end
