# frozen_string_literal: true

class StaticPagesController < ApplicationController
  include DocumentsHelper

  before_action :current_user_is_authorized_for_action!, only: [:panel_wfc]
  private def current_user_is_authorized_for_action!
    unless current_user.team_member?(Team.wfc)
      render json: {}, status: 401
    end
  end

  def home
  end

  def delegates
    @delegates = User.where.not(delegate_status: nil)
  end

  def panel_wfc
    render json: {
      isAtleastSeniorMember: current_user.team_senior_member?(Team.wfc) || current_user.team_leader?(Team.wfc),
    }
  end

  def score_tools
  end

  def logo
  end

  def teams_committees
    # get all users who hold one or more officer positions
    officer_users = Team.all_officers.map(&:current_members).inject(&:+).map(&:user)
    treasurers = Team.wfc.current_members.select(&:team_leader).map(&:user)
    @officers = (officer_users + treasurers).uniq
  end

  def wca_workbook_assistant
  end

  def wca_workbook_assistant_versions
  end

  def robots
    respond_to :txt
  end
end
