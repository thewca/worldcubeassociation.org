# frozen_string_literal: true

class AddEmailToSanityCheck < ActiveRecord::Migration[7.0]
  def change
    add_column :sanity_check_categories, :email_to, :string
  end
end
