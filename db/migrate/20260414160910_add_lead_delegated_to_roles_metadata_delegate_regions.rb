# frozen_string_literal: true

class AddLeadDelegatedToRolesMetadataDelegateRegions < ActiveRecord::Migration[8.1]
  def change
    add_column :roles_metadata_delegate_regions, :lead_delegated, :integer, after: :total_delegated
  end
end
