# frozen_string_literal: true

class PanelController < ApplicationController
  include DocumentsHelper

  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_access_panel?, params[:action].to_sym) }, except: [:pending_claims_for_subordinate_delegates]
  before_action -> { redirect_to_root_unless_user(:can_access_senior_delegate_panel?) }, only: [:pending_claims_for_subordinate_delegates]

  def pending_claims_for_subordinate_delegates
    # Show pending claims for a given user, or the current user, if they can see them
    user_id = params[:user_id] || current_user.id
    @user = User.find(user_id)
    @subordinate_delegates = @user.subordinate_delegates.to_a.push(@user)
  end

  def self.panel_list
    {
      "delegate" => {
        "importantLinks" => "important-links",
        "delegateHandbook" => "delegate-handbook",
        "bannedCompetitors" => "banned-competitors",
      },
      "board" => {
        "seniorDelegatesList" => "senior-delegates-list",
        "leadersAdmin" => "leaders-admin",
        "regionsManager" => "regions-manager",
        "delegateProbations" => "delegate-probations",
        "groupsManagerAdmin" => "groups-manager-admin",
        "boardEditor" => "board-editor",
        "officersEditor" => "officers-editor",
        "regionsAdmin" => "regions-admin",
        "bannedCompetitors" => "banned-competitors",
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
        "bannedCompetitors" => "banned-competitors",
      },
      "wst" => {
        "translators" => "translators",
      },
      "wdc" => {
        "bannedCompetitors" => "banned-competitors",
      },
      "wec" => {
        "bannedCompetitors" => "banned-competitors",
      },
      "weat" => {
        "bannedCompetitors" => "banned-competitors",
      },
    }
  end

  def self.panel_pages
    {
      "postingDashboard" => "posting-dashboard",
      "editPerson" => "edit-person",
      "regionsManager" => "regions-manager",
      "groupsManagerAdmin" => "groups-manager-admin",
      "bannedCompetitors" => "banned-competitors",
      "translators" => "translators",
      "duesExport" => "dues-export",
      "countryBands" => "country-bands",
      "delegateProbations" => "delegate-probations",
      "xeroUsers" => "xero-users",
      "duesRedirect" => "dues-redirect",
      "delegateForms" => "delegate-forms",
      "regions" => "regions",
      "subordinateDelegateClaims" => "subordinate-delegate-claims",
      "subordinateUpcomingCompetitions" => "subordinate-upcoming-competitions",
      "leaderForms" => "leader-forms",
      "groupsManager" => "groups-manager",
    }
  end
end
