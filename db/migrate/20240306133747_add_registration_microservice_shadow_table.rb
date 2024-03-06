# frozen_string_literal: true

class AddRegistrationMicroserviceShadowTable < ActiveRecord::Migration[7.1]
  def change
    create_table :microservice_registrations do |t|
      t.string :competition_id
      t.integer :user_id

      t.timestamps
    end
  end
end
