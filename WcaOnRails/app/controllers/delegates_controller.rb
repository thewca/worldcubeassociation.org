# frozen_string_literal: true

class DelegatesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_view_delegate_matters?) }

  def stats
    @delegates = User.delegates.includes(:actually_delegated_competitions)
  end

  def probations
    @probation_roles = Role.where(group_id: UserGroup.where(group_type: "delegate_probation"))
    @probation_users = @probation_roles.index_with { |probation_role|
      User.find_by_id(probation_role.user_id)
    }
  end

  def start_probation
    wca_id = params[:wcaId]
    user = User.find_by_wca_id!(wca_id)
    Role.create!(
      user_id: user.id,
      group_id: UserGroup.find_by!(name: "Delegate Probation").id,
      start_date: Date.today,
    )
  end

  def end_probation
    probation_role_id = params[:probationRoleId]
    role = Role.find_by_id(probation_role_id)
    role.update!(end_date: Date.today)
  end
end
