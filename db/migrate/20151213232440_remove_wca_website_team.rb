# frozen_string_literal: true

class RemoveWcaWebsiteTeam < ActiveRecord::Migration
  def change
    remove_column :users, :wca_website_team
    remove_column :users, :wca_website_team_leader
  end
end
