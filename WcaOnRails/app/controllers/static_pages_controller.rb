# frozen_string_literal: true

class StaticPagesController < ApplicationController
  include DocumentsHelper
  DONATE_PAYPAL_URL="https://www.paypal.com/donate/?hosted_button_id=W5JL8J4S8UTJU"
  DONATE_GUIDESTAR_URL="https://www.nfggive.com/guidestar/82-3825954"

  def home
  end

  def delegates
    @senior_delegates = User.where(delegate_status: "senior_delegate")
    @delegates_without_senior_delegates = User.where(delegate_status: ["candidate_delegate", "delegate"], senior_delegate: nil)
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

  def teams_committees_react
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
