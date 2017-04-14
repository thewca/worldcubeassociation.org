# frozen_string_literal: true

class RenameWebsiteToExternalWebsite < ActiveRecord::Migration
  def change
    rename_column :Competitions, :website, :external_website
  end
end
