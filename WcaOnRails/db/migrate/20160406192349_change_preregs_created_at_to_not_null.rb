class ChangePreregsCreatedAtToNotNull < ActiveRecord::Migration
  def change
    Registration.where(created_at: nil).each do |registration|
      registration.update_attribute :created_at, registration.competition.registration_open
    end
    change_column_null :Preregs, :created_at, false
  end
end
