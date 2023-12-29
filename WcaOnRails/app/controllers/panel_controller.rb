# frozen_string_literal: true

class PanelController < ApplicationController
  include DocumentsHelper

  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:staff_or_any_delegate?) }
  before_action -> { redirect_to_root_unless_user(:can_access_senior_delegate_panel?) }, only: [:pending_claims_for_subordinate_delegates]
  before_action -> { redirect_to_root_unless_user(:can_admin_finances?) }, only: [:wfc]
  before_action -> { redirect_to_root_unless_user(:can_access_board_panel?) }, only: [:board]

  def index
  end

  def pending_claims_for_subordinate_delegates
    # Show pending claims for a given user, or the current user, if they can see them
    user_id = params[:user_id] || current_user.id
    @user = User.find(user_id)
    @subordinate_delegates = @user.subordinate_delegates.to_a.push(@user)
  end

  private def editable_post_fields
    [:body]
  end
  helper_method :editable_post_fields

  private def post_params
    params.require(:post).permit(*editable_post_fields)
  end

  def self.panel_list
    {
      "board" => {
        "seniorDelegatesList" => "senior-delegates-list",
        "councilLeaders" => "council-leaders",
        "regionsManager" => "regions-manager",
        "delegateProbations" => "delegate-probations",
      },
      "seniorDelegate" => {
        "delegateForms" => "delegate-forms",
        "delegateProbations" => "delegate-probations",
        "subordinateDelegateClaims" => "subordinate-delegate-claims",
        "subordinateUpcomingCompetitions" => "subordinate-upcoming-competitions",
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
      },
      "wst" => {
        "translators" => "translators",
      },
    }
  end
end
