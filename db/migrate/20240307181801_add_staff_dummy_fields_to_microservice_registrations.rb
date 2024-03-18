# frozen_string_literal: true

class AddStaffDummyFieldsToMicroserviceRegistrations < ActiveRecord::Migration[7.1]
  def change
    add_column :microservice_registrations, :roles, :text, after: :user_id, null: true
    add_column :microservice_registrations, :is_competing, :boolean, after: :roles, default: true, null: false
  end
end
