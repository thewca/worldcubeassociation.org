# frozen_string_literal: true

class PanelController < ApplicationController
  include DocumentsHelper
  include PanelHelper

  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:has_permission?, 'can_access_panels', params[:panel_id].to_sym) }, only: [:index]
  before_action -> { redirect_to_root_unless_user(:can_access_panel?, params[:action].to_sym) }, except: [:pending_claims_for_subordinate_delegates, :index, :generate_db_token]
  before_action -> { redirect_to_root_unless_user(:can_access_senior_delegate_panel?) }, only: [:pending_claims_for_subordinate_delegates]
  before_action -> { redirect_to_root_unless_user(:can_access_panel?, :admin) }, only: [:generate_db_token]

  def pending_claims_for_subordinate_delegates
    # Show pending claims for a given user, or the current user, if they can see them
    user_id = params[:user_id] || current_user.id
    @user = User.find(user_id)
    @subordinate_delegates = @user.subordinate_delegates.to_a.push(@user)
  end

  def index
    @panel_id = params.require(:panel_id)
    panel_details = panel_list(current_user)[@panel_id.to_sym]
    @pages = panel_details[:pages]
    @title = panel_details[:name]
  end

  def generate_db_token
    @db_endpoints = {
      main: EnvConfig.DATABASE_HOST,
      replica: EnvConfig.READ_REPLICA_HOST,
    }

    role_credentials = Aws::ECSCredentials.new
    token_generator = Aws::RDS::AuthTokenGenerator.new credentials: role_credentials

    @db_tokens = @db_endpoints.transform_values do |url|
      token_generator.auth_token({
                                   region: EnvConfig.DATABASE_AWS_REGION,
                                   endpoint: "#{url}:3306",
                                   user_name: EnvConfig.DATABASE_WRT_USER,
                                 })
    end

    @db_server_indices = {
      main: 1,
      replica: 2,
    }
  end

  def self.panel_pages
    {
      postingDashboard: "posting-dashboard",
      editPerson: "edit-person",
      regionsManager: "regions-manager",
      groupsManagerAdmin: "groups-manager-admin",
      bannedCompetitors: "banned-competitors",
      translators: "translators",
      duesExport: "dues-export",
      countryBands: "country-bands",
      delegateProbations: "delegate-probations",
      xeroUsers: "xero-users",
      duesRedirect: "dues-redirect",
      delegateForms: "delegate-forms",
      regions: "regions",
      subordinateDelegateClaims: "subordinate-delegate-claims",
      subordinateUpcomingCompetitions: "subordinate-upcoming-competitions",
      leaderForms: "leader-forms",
      groupsManager: "groups-manager",
      importantLinks: "important-links",
      delegateHandbook: "delegate-handbook",
      seniorDelegatesList: "senior-delegates-list",
      leadersAdmin: "leaders-admin",
      boardEditor: "board-editor",
      officersEditor: "officers-editor",
      regionsAdmin: "regions-admin",
      downloadVoters: "download-voters",
      generateDbToken: "generate-db-token",
    }
  end
end
