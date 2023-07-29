# frozen_string_literal: true

class DelegatesController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_view_delegate_matters?) }

  def stats
    @delegates = User.delegates.includes(:actually_delegated_competitions)
  end

  def update_delegate
    user = User.where(id: params[:userId]).first
    if params[:status].nil? && !user.delegate_status.nil?
      # Case where the delegate's role is ended.
      user.update(region: nil, region_id: nil, delegate_status: nil)
    else
      # TODO: Validation of types and empty values
      user.update(region: params[:location], region_id: params[:regionId], delegate_status: params[:status])
    end
    render json: { ok: true }
  end
end
