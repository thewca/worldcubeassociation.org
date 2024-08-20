# frozen_string_literal: true

class AlterExternalRegistrationPageMaxLength < ActiveRecord::Migration[7.1]
  def change
    change_column :Competitions, :external_registration_page, :string, limit: 200
  end
end
