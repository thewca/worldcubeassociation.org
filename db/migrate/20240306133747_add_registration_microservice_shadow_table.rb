# frozen_string_literal: true

class AddRegistrationMicroserviceShadowTable < ActiveRecord::Migration[7.1]
  def change
    create_table :microservice_registrations do |t|
      t.string :competition_id
      t.integer :user_id

      t.timestamps

      t.index [:competition_id, :user_id], unique: true
    end
  end
end
