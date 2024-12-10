# frozen_string_literal: true

class RemoveV1Columns < ActiveRecord::Migration[7.2]
  def change
    remove_column :registrations, :accepted_at
    remove_column :registrations, :deleted_at
    remove_column :registrations, :accepted_by
    remove_column :registrations, :deleted_by
    remove_column :Competitions, :registration_version
    drop_table :microservice_registrations
  end
end
