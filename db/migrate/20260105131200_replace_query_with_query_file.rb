# frozen_string_literal: true

class ReplaceQueryWithQueryFile < ActiveRecord::Migration[8.1]
  def up
    remove_column :sanity_checks, :query, :text
    add_column :sanity_checks, :query_file, :text
  end
end
