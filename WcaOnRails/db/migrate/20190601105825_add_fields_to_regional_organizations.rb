# frozen_string_literal: true

class AddFieldsToRegionalOrganizations < ActiveRecord::Migration[5.2]
  def change
    add_column :regional_organizations, :email, :string, null: false
    add_column :regional_organizations, :address, :string, null: false
    add_column :regional_organizations, :directors_and_officers, :text, null: false
    add_column :regional_organizations, :area_description, :text, null: false
    add_column :regional_organizations, :past_and_current_activities, :text, null: false
    add_column :regional_organizations, :future_plans, :text, null: false
    add_column :regional_organizations, :extra_information, :text, default: nil
  end
end
