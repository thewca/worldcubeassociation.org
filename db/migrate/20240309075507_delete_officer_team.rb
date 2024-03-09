# frozen_string_literal: true

class DeleteOfficerTeam < ActiveRecord::Migration[7.1]
  def change
    Team.c_find_by_friendly_id!('executive_director').team_members.delete_all
    Team.c_find_by_friendly_id!('executive_director').delete
    Team.c_find_by_friendly_id!('chair').team_members.delete_all
    Team.c_find_by_friendly_id!('chair').delete
    Team.c_find_by_friendly_id!('vice_chair').team_members.delete_all
    Team.c_find_by_friendly_id!('vice_chair').delete
    Team.c_find_by_friendly_id!('secretary').team_members.delete_all
    Team.c_find_by_friendly_id!('secretary').delete
  end
end
