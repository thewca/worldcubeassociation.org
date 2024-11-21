# frozen_string_literal: true

class AddNewV2Columns < ActiveRecord::Migration[7.2]
  def change
    add_column :registrations, :rejected_at, :datetime
    add_column :registrations, :waitlisted_at, :datetime
  end
end
