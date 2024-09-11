# frozen_string_literal: true

class StaticPagesController < ApplicationController
  include DocumentsHelper

  before_action :current_user_can_admin_finances!, only: [:panel_wfc]
  private def current_user_can_admin_finances!
    unless current_user.can_admin_finances?
      render json: {}, status: 401
    end
  end

  def home
  end

  def score_tools
  end

  def logo
  end

  def api_help
  end

  def robots
    respond_to :txt
  end
end
