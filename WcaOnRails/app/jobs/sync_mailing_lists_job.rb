# frozen_string_literal: true

class SyncMailingListsJob < WcaCronjob
  before_enqueue do
    # NOTE: we want to only do this on the actual "production" server, as we need the real users' emails.
    throw :abort unless EnvConfig.WCA_LIVE_SITE?
  end

  def perform
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
    translator_users = UserGroup.translator_groups.flat_map(&:users)
    GsuiteMailingLists.sync_group("translators@worldcubeassociation.org", translator_users.map(&:email))
    User.clear_receive_delegate_reports_if_not_eligible
    GsuiteMailingLists.sync_group("reports@worldcubeassociation.org", User.delegate_reports_receivers_emails)
    GsuiteMailingLists.sync_group("advisory@worldcubeassociation.org", Team.wac.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("sports@worldcubeassociation.org", Team.wsot.current_members.includes(:user).map(&:user).map(&:email))
    GsuiteMailingLists.sync_group("archive@worldcubeassociation.org", Team.wat.current_members.includes(:user).map(&:user).map(&:email))

    delegate_emails = []
    trainee_emails = []
    senior_emails = []
    UserGroup.delegate_region_groups.each do |region|
      region_emails = []
      region.roles.each do |role|
        region_emails << role[:user][:email]
        if role[:metadata][:status] == "trainee_delegate"
          trainee_emails << role[:user][:email]
        else
          delegate_emails << role[:user][:email]
        end
        if role[:metadata][:status] == "senior_delegate"
          senior_emails << role[:user][:email]
        end
      end
      region_email_id = region.metadata&.email
      if region_email_id.present?
        GsuiteMailingLists.sync_group(region_email_id, region_emails)
      end
    end
    GsuiteMailingLists.sync_group("delegates@worldcubeassociation.org", delegate_emails)
    GsuiteMailingLists.sync_group("trainees@worldcubeassociation.org", trainee_emails)
    GsuiteMailingLists.sync_group("seniors@worldcubeassociation.org", senior_emails)

    organizations = RegionalOrganization.currently_acknowledged + [Team.board]
    GsuiteMailingLists.sync_group("organizations@worldcubeassociation.org", organizations.map(&:email))
  end
end
