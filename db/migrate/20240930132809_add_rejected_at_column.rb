# frozen_string_literal: true

class AddRejectedAtColumn < ActiveRecord::Migration[7.2]
  def change
    add_column :registrations, :rejected_at, :datetime
  end
end
