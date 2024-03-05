# frozen_string_literal: true

class AddDobGenderCountryToUsers < ActiveRecord::Migration
  def change
    add_column :users, :dob, :date
    add_column :users, :gender, :string
    add_column :users, :country_iso2, :string
    reversible do |change|
      change.up do
        User.where.not(wca_id: nil).find_each do |user|
          user.copy_data_from_persons
          user.skip_confirmation_notification!
          user.save
        end
      end
      change.down do
      end
    end
  end
end
