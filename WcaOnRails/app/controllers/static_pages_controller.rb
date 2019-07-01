# frozen_string_literal: true

class StaticPagesController < ApplicationController
  include DocumentsHelper

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
    @officers = []
    (officer_users + treasurers).uniq.each do |user|
      # for each officer, find all officer teams they belong to
      positions = user.current_teams.select { |team| Team.all_officers.include? team }.map(&:name)
      if Team.wfc.current_members.select(&:team_leader).map(&:user).include?(user)
        positions.push(t('about.structure.treasurer.name'))
      end
      @officers.push([user, positions.join("<br />").html_safe])
    end
  end

  def wca_workbook_assistant
  end

  def wca_workbook_assistant_versions
  end

  def robots
    respond_to :txt
  end
end
