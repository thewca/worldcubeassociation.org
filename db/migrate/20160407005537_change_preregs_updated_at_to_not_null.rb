# rubocop:disable all
# frozen_string_literal: true

class ChangePreregsUpdatedAtToNotNull < ActiveRecord::Migration
  def change
    Registration.where(updated_at: nil).find_each do |registration|
      registration.update_attribute :updated_at, registration.created_at
    end
    change_column_null :Preregs, :updated_at, false
  end
end
