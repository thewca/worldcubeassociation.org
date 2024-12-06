# frozen_string_literal: true

class RemoveV1Columns < ActiveRecord::Migration[7.2]
  def change
    remove_column :registrations, :deleted_at, :datetime
    remove_column :registrations, :deleted_by, :integer
    remove_column :registrations, :accepted_at, :datetime
    remove_column :registrations, :accepted_by, :integer
  end
end
