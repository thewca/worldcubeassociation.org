# frozen_string_literal: true

class RolesController < ApplicationController
  def role_list
    respond_to do |format|
      format.json do
        user_id = params.require(:userId)
        user = User.find(user_id)
        is_delegate = user.delegate_status.present?
        active_roles = is_delegate ? [{ role: user.delegate_status }] : []
        render json: {
          activeRoles: active_roles,
        }
      end
    end
  end

  def role_data
    respond_to do |format|
      format.json do
        user_id = params.require(:userId)
        role_id = params.require(:roleId)
        senior_delegates = User.where(delegate_status: "senior_delegate")
        if role_id == 'new'
          render json: {
            roleData: {},
            seniorDelegates: senior_delegates,
          }
        else
          user = User.find(user_id)
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

  def send_email(user)
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
  end

  def role_update
    respond_to do |format|
      format.json do
        user_id = params.require(:userId)
        user = User.find(user_id)
        delegate_status = params.require(:delegateStatus)
        senior_delegate_id = params.require(:seniorDelegateId)
        location = params.require(:location)
        user.update!(delegate_status: delegate_status, senior_delegate_id: senior_delegate_id, location: location)
        send_email(user)
        render json: {
          success: true,
        }
      end
    end
  end

  def role_end
    respond_to do |format|
      format.json do
        user_id = params.require(:userId)
        user = User.find(user_id)
        user.update!(delegate_status: '', senior_delegate_id: '', location: '')
        send_email
        render json: {
          success: true,
        }
      end
    end
  end
end
