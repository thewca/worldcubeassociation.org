# frozen_string_literal: true

class PanelController < ApplicationController
  include DocumentsHelper

  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:staff_or_any_delegate?) }
  before_action -> { redirect_to_root_unless_user(:can_access_senior_delegate_panel?) }, only: [:pending_claims_for_subordinate_delegates]
  before_action -> { redirect_to_root_unless_user(:can_access_board_panel?) }, only: [:board]
  before_action -> { redirect_to_root_unless_user(:can_access_senior_delegate_panel?) }, only: [:senior_delegate]
  before_action -> { redirect_to_root_unless_user(:can_access_leader_panel?) }, only: [:leader]
  before_action -> { redirect_to_root_unless_user(:can_access_wfc_panel?) }, only: [:wfc]
  before_action -> { redirect_to_root_unless_user(:can_access_wrt_panel?) }, only: [:wrt]
  before_action -> { redirect_to_root_unless_user(:can_access_wst_panel?) }, only: [:wst]

  def index
  end

  def pending_claims_for_subordinate_delegates
    # Show pending claims for a given user, or the current user, if they can see them
    user_id = params[:user_id] || current_user.id
    @user = User.find(user_id)
    @subordinate_delegates = @user.subordinate_delegates.to_a.push(@user)
  end

  def self.panel_list
    {
      "board" => {
        "seniorDelegatesList" => "senior-delegates-list",
        "councilLeaders" => "council-leaders",
        "regionsManager" => "regions-manager",
        "delegateProbations" => "delegate-probations",
        "groupsManagerAdmin" => "groups-manager-admin",
        "officersEditor" => "officers-editor",
        "regionsAdmin" => "regions-admin",
      },
      "seniorDelegate" => {
        "delegateForms" => "delegate-forms",
        "regions" => "regions",
        "delegateProbations" => "delegate-probations",
        "subordinateDelegateClaims" => "subordinate-delegate-claims",
        "subordinateUpcomingCompetitions" => "subordinate-upcoming-competitions",
      },
      "leader" => {
        "leaderForms" => "leader-forms",
        "groupsManager" => "groups-manager",
      },
      "wfc" => {
        "duesExport" => "dues-export",
        "countryBands" => "country-bands",
        "delegateProbations" => "delegate-probations",
        "xeroUsers" => "xero-users",
        "duesRedirect" => "dues-redirect",
      },
      "wrt" => {
        "postingDashboard" => "posting-dashboard",
        "editPerson" => "edit-person",
        "regionsManager" => "regions-manager",
      },
      "wst" => {
        "translators" => "translators",
      },
    }
  end
end
