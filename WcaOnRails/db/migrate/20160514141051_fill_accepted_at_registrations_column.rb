# frozen_string_literal: true

class FillAcceptedAtRegistrationsColumn < ActiveRecord::Migration
  def change
    # Move the data
    Registration.where(status: "a").includes(:competition).each do |registration|
      registration.update_column(:accepted_at, registration.competition.registration_open) if registration.competition
    end

    # Remove the column
    remove_column :Preregs, :status
  end
end
