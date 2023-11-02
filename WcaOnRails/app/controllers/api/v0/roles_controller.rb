# frozen_string_literal: true

class Api::V0::RolesController < Api::V0::ApiController
  before_action :current_user_is_authorized_for_action!, only: [:update, :destroy]
  private def current_user_is_authorized_for_action!
    unless current_user.board_member? || current_user.senior_delegate?
      render json: {}, status: 401
    end
  end

  def index
    user_id = params.require(:userId)
    user = User.find(user_id)
    is_delegate = user.delegate_status.present?
    active_roles = is_delegate ? [{ role: user.delegate_status }] : []

    render json: {
      activeRoles: active_roles,
    }
  end

  def show
    user_id = params.require(:userId)
    is_active_role = ActiveRecord::Type::Boolean.new.cast(params.require(:isActiveRole))
    senior_delegates = User.where(delegate_status: "senior_delegate")

    if is_active_role
      user = User.find(user_id)
      render json: {
        roleData: {
          delegateStatus: user.delegate_status,
          seniorDelegateId: user.senior_delegate.id,
          location: user.location,
        },
        seniorDelegates: senior_delegates,
      }
    else
      render json: {
        roleData: {},
        seniorDelegates: senior_delegates,
      }
    end
  end

  def update
    user_id = params.require(:userId)
    delegate_status = params.require(:delegateStatus)
    senior_delegate_id = params.require(:seniorDelegateId)
    location = params.require(:location)

    user = User.find(user_id)
    user.update!(delegate_status: delegate_status, senior_delegate_id: senior_delegate_id, location: location)
    send_role_change_notification(user)

    render json: {
      success: true,
    }
  end

  def destroy
    user_id = params.require(:userId)

    user = User.find(user_id)
    user.update!(delegate_status: '', senior_delegate_id: '', location: '')
    send_role_change_notification(user)

    render json: {
      success: true,
    }
  end

  private def send_role_change_notification(user)
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
end
