# frozen_string_literal: true

class AddRolesToRegistration < ActiveRecord::Migration[5.1]
  def change
    add_column :registrations, :roles, :text
  end
end
