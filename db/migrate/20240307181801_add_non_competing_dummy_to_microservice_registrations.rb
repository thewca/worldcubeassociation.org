# frozen_string_literal: true

class AddNonCompetingDummyToMicroserviceRegistrations < ActiveRecord::Migration[7.1]
  def change
    add_column :microservice_registrations, :non_competing_dummy, :boolean, after: :user_id, default: false
  end
end
