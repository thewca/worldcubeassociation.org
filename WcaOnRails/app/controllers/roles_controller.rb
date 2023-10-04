# frozen_string_literal: true

class RolesController < ApplicationController
  def role_list
    respond_to do |format|
      format.json do
        user = User.find(params[:userId])
        is_delegate = !user.delegate_status.nil?
        active_roles = is_delegate ? [{'role': user.delegate_status}] : []
        render json: {
          activeRoles: active_roles,
        }
      end
    end
  end

  def role_data
    respond_to do |format|
      format.json do
        role_id = params[:roleId]
        senior_delegates = User.where(delegate_status: "senior_delegate")
        if role_id == 'new'
          render json: {
            roleData: {},
            seniorDelegates: senior_delegates,
          }
        else
          user = User.find(params[:userId])
          render json: {
            roleData: {
              delegateStatus: user.delegate_status,
              seniorDelegateId: user.senior_delegate.id,
              location: user.location,
            },
            seniorDelegates: senior_delegates,
          }
        end
      end
    end
  end

  def role_update
    respond_to do |format|
      format.json do
        user = User.find(params[:userId])
        user.update!(delegate_status: params[:delegateStatus], senior_delegate_id: params[:seniorDelegateId], location: params[:location])
        if user.saved_change_to_delegate_status
          if user.delegate_status
            user_senior_delegate = user.senior_or_self
          else
            user_senior_delegate = User.find(user.senior_delegate_id_before_last_save)
          end
          DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(
            user,
            current_user,
            user_senior_delegate,
            user.delegate_status_before_last_save,
            user.delegate_status,
          ).deliver_later
        end
        render json: {
          success: true,
        }
      end
    end
  end
end
