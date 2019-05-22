# frozen_string_literal: true

class SyncMailingListsJob < ApplicationJob
  queue_as :default

  SENIOR_DELEGATES_REGIONS_INFO = [
    {
      mailing_list: "delegates.africa@worldcubeassociation.org",
      query: "%Africa%",
    },
    {
      mailing_list: "delegates.asia-east@worldcubeassociation.org",
      query: "%Asia East%",
    },
    {
      mailing_list: "delegates.asia-japan@worldcubeassociation.org",
      query: "%Asia Japan%",
    },
    {
      mailing_list: "delegates.asia-southeast@worldcubeassociation.org",
      query: "%Asia Southeast%",
    },
    {
      mailing_list: "delegates.asia-west-india@worldcubeassociation.org",
      query: "%Asia West & India%",
    },
    {
      mailing_list: "delegates.europe-east-middle-east@worldcubeassociation.org",
      query: "%Europe East & Middle East%",
    },
    {
      mailing_list: "delegates.europe-north-baltic-states@worldcubeassociation.org",
      query: "%Europe North & Baltic States%",
    },
    {
      mailing_list: "delegates.europe-west@worldcubeassociation.org",
      query: "%Europe West%",
    },
    {
      mailing_list: "delegates.latin-america@worldcubeassociation.org",
      query: "%Latin America%",
    },
    {
      mailing_list: "delegates.oceania@worldcubeassociation.org",
      query: "%Oceania%",
    },
    {
      mailing_list: "delegates.usa-canada@worldcubeassociation.org",
      query: "%USA & Canada%",
    },
  ].freeze

  def perform
    GsuiteMailingLists.sync_group("delegates@worldcubeassociation.org", User.delegates.map(&:email))
    GsuiteMailingLists.sync_group("seniors@worldcubeassociation.org", User.senior_delegates.map(&:email))
    GsuiteMailingLists.sync_group("leaders@worldcubeassociation.org", TeamMember.current.in_official_team.leader.map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("board@worldcubeassociation.org", Team.board.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("communication@worldcubeassociation.org", Team.wct.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("competitions@worldcubeassociation.org", Team.wcat.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("disciplinary@worldcubeassociation.org", Team.wdc.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("dataprotection@worldcubeassociation.org", Team.wdpc.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("ethics@worldcubeassociation.org", Team.wec.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("finance@worldcubeassociation.org", Team.wfc.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("treasurer@worldcubeassociation.org", Team.wfc.current_members.leader.map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("marketing@worldcubeassociation.org", Team.wmt.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("quality@worldcubeassociation.org", Team.wqac.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("regulations@worldcubeassociation.org", Team.wrc.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("results@worldcubeassociation.org", Team.wrt.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("software@worldcubeassociation.org", Team.wst.current_members.includes(:user).map(&:user).map(&:email))
    translators = User.where(id: TranslationsController::VERIFIED_TRANSLATORS_BY_LOCALE.values.flatten)
    GsuiteMailingLists.sync_group("translators@worldcubeassociation.org", translators.map(&:email))
    User.clear_receive_delegate_reports_if_not_staff
    GsuiteMailingLists.sync_group("reports@worldcubeassociation.org", User.delegate_reports_receivers_emails)
    GsuiteMailingLists.sync_group("advisory@worldcubeassociation.org", Team.wac.current_members.includes(:user).map(&:user).map(&:email))

    SENIOR_DELEGATES_REGIONS_INFO.each do |region|
      senior_delegates = User.senior_delegates.where("region like ?", region[:query])
      if senior_delegates.length > 1
        raise "Multiple Senior Delegates match #{region[:query]}"
      elsif senior_delegates.empty?
        raise "No Senior Delegate matches #{region[:query]}"
      else
        senior_delegate = senior_delegates.first
      end
      delegates = senior_delegate.subordinate_delegates
      GsuiteMailingLists.sync_group(region[:mailing_list], (delegates + [senior_delegate]).map(&:email))
    end
  end
end
