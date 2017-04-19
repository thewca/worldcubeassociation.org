# frozen_string_literal: true

class RemoveEmptyStringWcaIdsFromUsers < ActiveRecord::Migration
  def change
    User.all.each do |user|
      if user.wca_id == ""
        user.update_attribute(:wca_id, nil)
      end
    end
  end
end
