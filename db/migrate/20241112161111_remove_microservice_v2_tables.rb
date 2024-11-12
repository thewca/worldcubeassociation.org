# frozen_string_literal: true

class RemoveMicroserviceV2Tables < ActiveRecord::Migration[7.2]
  def change
    drop_table :microservice_registrations
  end
end
