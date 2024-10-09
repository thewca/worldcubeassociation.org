# frozen_string_literal: true

class AddCascadeToMicroserviceCompetitionId < ActiveRecord::Migration[7.2]
  def change
    remove_foreign_key :microservice_registrations, :Competitions
    add_foreign_key :microservice_registrations, :Competitions, on_update: :cascade, on_delete: :cascade
  end
end
