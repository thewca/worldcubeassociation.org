# frozen_string_literal: true

class SyncMailingListsJob < WcaCronjob
  EXECUTIVE_DIRECTOR_EMAIL = 'rmurphy@worldcubeassociation.org'

  before_enqueue do
    # NOTE: we want to only do this on the actual "production" server, as we need the real users' emails.
    throw :abort unless EnvConfig.WCA_LIVE_SITE?
  end

  # Google APIs have extremely strict quotas, but their Ruby SDK client offers no batching or request backoff...
  #   And since I don't feel like building our own request queue with timed execution, we just let Sidekiq retry.
  # However, the fail happens relatively fast, and we want to avoid Sidekiq retrying over and over again
  sidekiq_options retry: 10

  def perform
    GsuiteMailingLists.sync_group("leaders@worldcubeassociation.org", UserGroup.teams_committees.filter_map(&:lead_user).map(&:email))
    board_users = UserGroup.board_group.active_users.map(&:email) | [EXECUTIVE_DIRECTOR_EMAIL]
    GsuiteMailingLists.sync_group(GroupsMetadataBoard.email, board_users)
    translator_users = UserGroup.translators.flat_map(&:users)
    GsuiteMailingLists.sync_group("translators@worldcubeassociation.org", translator_users.map(&:email))

    User.clear_receive_delegate_reports_if_not_eligible

    report_user_emails = User.delegate_reports_receivers_emails
    GsuiteMailingLists.sync_group(DelegateReport::GLOBAL_MAILING_LIST, report_user_emails)

    Continent.uncached_real.each do |continent|
      continent_list_address = DelegateReport.continent_mailing_list(continent)
      report_user_emails = User.delegate_reports_receivers_emails(continent)

      GsuiteMailingLists.sync_group(continent_list_address, report_user_emails | [DelegateReport::GLOBAL_MAILING_LIST])

      continent.countries.uncached_real.each do |country|
        country_list_address = DelegateReport.country_mailing_list(country, continent)
        report_user_emails = User.delegate_reports_receivers_emails(country)

        GsuiteMailingLists.sync_group(country_list_address, report_user_emails | [continent_list_address])
      end
    end

    UserGroup.teams_committees.active_groups.each { |team_committee| GsuiteMailingLists.sync_group(team_committee.metadata.email, team_committee.active_users.map(&:email)) }
    # Special case: WIC is the first committee in our (recent) history that "absorbed" another team's duties:
    #   They are now a "mix" of WDC and WEC. The structures have been mapped so that WIC reuses WDC's groups,
    #   so they get WDC access "for free". But they _also_ need to be synced to ethics@ to view old conversations from there.
    GsuiteMailingLists.sync_group("ethics@worldcubeassociation.org", GroupsMetadataTeamsCommittees.wic.user_group.active_users.pluck(:email))

    treasurers = UserGroup.officers.flat_map(&:active_roles).filter { |role| role.metadata.status == RolesMetadataOfficers.statuses[:treasurer] }
    GsuiteMailingLists.sync_group("treasurer@worldcubeassociation.org", treasurers.map { |x| x.user.email })

    delegate_emails = []
    trainee_emails = []
    senior_emails = []
    active_root_delegate_regions = UserGroup.delegate_regions.where(parent_group_id: nil, is_active: true)
    active_root_delegate_regions.each do |region|
      region_emails = []
      (region.active_roles + region.active_all_child_roles).each do |role|
        role_email = role.user.email
        role_status = role.metadata.status
        region_emails << role_email
        if role_status == RolesMetadataDelegateRegions.statuses[:trainee_delegate]
          trainee_emails << role_email
        else
          delegate_emails << role_email
        end
        senior_emails << role_email if role_status == RolesMetadataDelegateRegions.statuses[:senior_delegate]
      end
      region_email_id = region.metadata&.email
      GsuiteMailingLists.sync_group(region_email_id, region_emails.uniq) if region_email_id.present?
    end
    GsuiteMailingLists.sync_group("delegates@worldcubeassociation.org", delegate_emails.uniq)
    GsuiteMailingLists.sync_group("trainees@worldcubeassociation.org", trainee_emails.uniq)
    GsuiteMailingLists.sync_group("seniors@worldcubeassociation.org", senior_emails.uniq)

    organizations_emails = [RegionalOrganization.currently_acknowledged.map(&:email), GroupsMetadataBoard.email].flatten
    GsuiteMailingLists.sync_group("organizations@worldcubeassociation.org", organizations_emails)
  end
end
