# frozen_string_literal: true

class RemoveDescriptionFromTeams < ActiveRecord::Migration[5.0]
  def change
    remove_column :teams, :description, :text
    remove_column :teams, :name, :string
    add_column :teams, :email, :string
    add_column :teams, :rank, :integer

    add_index :teams, :rank

    reversible do |dir|
      dir.up do
        # silly utf8mb4 can't do indices on strings longer than 191
        change_column :teams, :friendly_id, :string, limit: 191

        Team.find_by_friendly_id("software").update!(friendly_id: "wst")
        Team.find_by_friendly_id("results").update!(friendly_id: "wrt")

        Team.find_by_friendly_id('wct').update!(rank: 1, email: "communication@worldcubeassociation.org")
        Team.find_by_friendly_id('wdc').update!(rank: 2, email: "wdc@worldcubeassociation.org")
        Team.find_by_friendly_id('wrc').update!(rank: 3, email: "wrc@worldcubeassociation.org")
        Team.find_by_friendly_id('wrt').update!(rank: 4, email: "results@worldcubeassociation.org")
        Team.find_by_friendly_id('wst').update!(rank: 5, email: "software@worldcubeassociation.org")
      end
      dir.down do
        Team.find_by_friendly_id("wrt").update!(friendly_id: "results")
        Team.find_by_friendly_id("wst").update!(friendly_id: "software")

        change_column :teams, :friendly_id, :string, limit: 255
      end
    end

    add_index :teams, :friendly_id
  end
end
