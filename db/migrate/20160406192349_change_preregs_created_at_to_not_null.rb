# frozen_string_literal: true

class ChangePreregsCreatedAtToNotNull < ActiveRecord::Migration
  def change
    Registration.where(created_at: nil).each do |registration|
      # Not all competitions that used WCA registration actually have registration_open set,
      # so just pick a day before the competition as the day that these old registrations
      # were created.
      registration.update_attribute :created_at, registration.competition.registration_open || (registration.competition.start_date - 1.day)
    end
    change_column_null :Preregs, :created_at, false
  end
end
