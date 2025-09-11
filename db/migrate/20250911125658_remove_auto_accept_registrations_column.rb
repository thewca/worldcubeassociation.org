# frozen_string_literal: true

class RemoveAutoAcceptRegistrationsColumn < ActiveRecord::Migration[7.2]
  def change
    remove_column :competitions, :auto_accept_registrations, :boolean
  end
end
