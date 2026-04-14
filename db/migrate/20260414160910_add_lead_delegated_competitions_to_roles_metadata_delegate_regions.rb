# frozen_string_literal: true

class AddLeadDelegatedCompetitionsToRolesMetadataDelegateRegions < ActiveRecord::Migration[8.1]
  def change
    add_column :roles_metadata_delegate_regions, :lead_delegated_competitions, :integer
  end
end
