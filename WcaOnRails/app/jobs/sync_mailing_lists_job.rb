# frozen_string_literal: true

class SyncMailingListsJob < ApplicationJob
  include SingletonApplicationJob

  queue_as :default

  def perform
    GsuiteMailingLists.sync_group("delegates@worldcubeassociation.org", User.staff_delegates.map(&:email))
    GsuiteMailingLists.sync_group("trainees@worldcubeassociation.org", User.trainee_delegates.map(&:email))
    GsuiteMailingLists.sync_group("seniors@worldcubeassociation.org", User.senior_delegates.map(&:email))
    GsuiteMailingLists.sync_group("leaders@worldcubeassociation.org", TeamMember.current.in_official_team.leader.map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("board@worldcubeassociation.org", Team.board.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("communication@worldcubeassociation.org", Team.wct.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("communication-china@worldcubeassociation.org", Team.wct_china.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("competitions@worldcubeassociation.org", Team.wcat.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("disciplinary@worldcubeassociation.org", Team.wdc.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("ethics@worldcubeassociation.org", Team.wec.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("assistants@worldcubeassociation.org", Team.weat.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("finance@worldcubeassociation.org", Team.wfc.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("treasurer@worldcubeassociation.org", Team.wfc.current_members.leader.map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("marketing@worldcubeassociation.org", Team.wmt.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("quality@worldcubeassociation.org", Team.wqac.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("regulations@worldcubeassociation.org", Team.wrc.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("results@worldcubeassociation.org", Team.wrt.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("software@worldcubeassociation.org", Team.wst.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("software-admin@worldcubeassociation.org", Team.wst_admin.current_members.includes(:user).map(&:user).map(&:email))
    translators = User.where(id: TranslationsController::VERIFIED_TRANSLATORS_BY_LOCALE.values.flatten)
    GsuiteMailingLists.sync_group("translators@worldcubeassociation.org", translators.map(&:email))
    User.clear_receive_delegate_reports_if_not_eligible
    GsuiteMailingLists.sync_group("reports@worldcubeassociation.org", User.delegate_reports_receivers_emails)
    GsuiteMailingLists.sync_group("advisory@worldcubeassociation.org", Team.wac.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("sports@worldcubeassociation.org", Team.wsot.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("archive@worldcubeassociation.org", Team.wat.current_members.includes(:user).map(&:user).map(&:email))

    Region.all_active.each do |region|
      if region.senior_delegates.length != 1
        raise "Multiple or no Senior Delegates in region #{region.name}"
      end
      mailing_list = "delegates.#{region.friendly_id}@worldcubeassociation.org"
      GsuiteMailingLists.sync_group(mailing_list, region.delegates.map(&:email))
    end

    organizations = RegionalOrganization.currently_acknowledged + [Team.board]
    GsuiteMailingLists.sync_group("organizations@worldcubeassociation.org", organizations.map(&:email))
  end
end
