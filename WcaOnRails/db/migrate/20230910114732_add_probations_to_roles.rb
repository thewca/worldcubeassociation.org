# frozen_string_literal: true

class AddProbationsToRoles < ActiveRecord::Migration[7.0]
  def change
    Team.probation.team_members.each do |team_member|
      role = Role.new(
        user_id: team_member.user_id,
        group_id: Group.find_by!(name: "Delegate Probation").id,
        start_date: team_member.start_date,
        end_date: team_member.end_date,
      )
      role.save!
    end
  end
end
