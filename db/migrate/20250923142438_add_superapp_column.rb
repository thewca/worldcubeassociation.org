# frozen_string_literal: true

class AddSuperappColumn < ActiveRecord::Migration[7.2]
  def change
    add_column :oauth_applications, :superapp, :boolean, default: false, null: false
  end
end
