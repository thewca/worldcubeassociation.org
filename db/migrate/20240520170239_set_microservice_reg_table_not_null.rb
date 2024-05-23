# frozen_string_literal: true

class SetMicroserviceRegTableNotNull < ActiveRecord::Migration[7.1]
  def change
    # First make sure we don't have any erroneous data temporarily present
    MicroserviceRegistration.where(competition_id: nil).delete_all
    MicroserviceRegistration.where(user_id: nil).delete_all

    # The 'limit' option on the competition_id column is implied by the primary key in 'Competitions' table
    #   (which is historically set at VARCHAR(32))
    change_column :microservice_registrations, :competition_id, :string, limit: 32, null: false
    change_column :microservice_registrations, :user_id, :integer, null: false

    add_foreign_key :microservice_registrations, :Competitions, column: :competition_id, index: true
    add_foreign_key :microservice_registrations, :users, index: true
  end
end
