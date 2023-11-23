# frozen_string_literal: true

class Api::V0::Wfc::XeroUsersController < Api::V0::ApiController
  before_action :current_user_can_admin_finances!, only: [:index, :create]
  private def current_user_can_admin_finances!
    unless current_user.can_admin_finances?
      render json: {}, status: 401
    end
  end

  def index
    render json: WfcXeroUser.all
  end

  def create
    name = params.require(:name)
    email = params.require(:email)
    is_combined_invoice = ActiveRecord::Type::Boolean.new.cast(params.require(:is_combined_invoice))
    wfc_xero_user = WfcXeroUser.new(name: name, email: email, is_combined_invoice: is_combined_invoice)
    if wfc_xero_user.save
      render json: wfc_xero_user, status: :created
    else
      render json: wfc_xero_user.errors, status: :unprocessable_entity
    end
  end
end
