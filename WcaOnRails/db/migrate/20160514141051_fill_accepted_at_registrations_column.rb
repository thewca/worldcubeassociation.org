class FillAcceptedAtRegistrationsColumn < ActiveRecord::Migration
  def change
    # Move the data
    Registration.where(status: "a").includes(:competition).each do |registration|
      registration.update!(accepted_at: registration.competition.registration_open)
    end

    # Remove the column
    remove_column :Preregs, :status
  end
end
