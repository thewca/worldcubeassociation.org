# frozen_string_literal: true

class SyncMailingListsJob < WcaCronjob
  before_enqueue do
    # NOTE: we want to only do this on the actual "production" server, as we need the real users' emails.
    throw :abort unless EnvConfig.WCA_LIVE_SITE?
  end

  def perform
    GsuiteMailingLists.sync_group("leaders@worldcubeassociation.org", UserGroup.teams_committees.map(&:lead_user).compact.map(&:email))
    GsuiteMailingLists.sync_group(GroupsMetadataBoard.email, UserGroup.board_group.active_users.map(&:email))
    translator_users = UserGroup.translators.flat_map(&:users)
    GsuiteMailingLists.sync_group("translators@worldcubeassociation.org", translator_users.map(&:email))

    User.clear_receive_delegate_reports_if_not_eligible

    report_users = User.where(receive_delegate_reports: true, delegate_reports_region: [nil, '']).pluck(:email)
    GsuiteMailingLists.sync_group("reports@worldcubeassociation.org", report_users | User.default_report_receivers)

    Continent.real.each do |continent|
      continent_mailing = "reports.#{continent.name.downcase}@worldcubeassociation.org"
      report_users = User.where(receive_delegate_reports: true, delegate_reports_region: continent.id).pluck(:email)

      GsuiteMailingLists.sync_group(continent_mailing, report_users | ["reports@worldcubeassociation.org"])

      continent.countries.real.each do |country|
        country_mailing = "reports.#{continent.name.downcase}.#{country.iso2}@worldcubeassociation.org"
        report_users = User.where(receive_delegate_reports: true, delegate_reports_region: country.id).pluck(:email)

        GsuiteMailingLists.sync_group(country_mailing, report_users | [continent_mailing])
      end
    end

    UserGroup.teams_committees.active_groups.each { |team_committee| GsuiteMailingLists.sync_group(team_committee.metadata.email, team_committee.active_users.map(&:email)) }
    UserGroup.councils.each { |council| GsuiteMailingLists.sync_group(council.metadata.email, council.active_users.map(&:email)) }

    treasurers = UserGroup.officers.flat_map(&:active_roles).filter { |role| role.metadata.status == RolesMetadataOfficers.statuses[:treasurer] }
    GsuiteMailingLists.sync_group("treasurer@worldcubeassociation.org", treasurers.map(&:user).map(&:email))

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
        if role_status == RolesMetadataDelegateRegions.statuses[:senior_delegate]
          senior_emails << role_email
        end
      end
      region_email_id = region.metadata&.email
      if region_email_id.present?
        GsuiteMailingLists.sync_group(region_email_id, region_emails.uniq)
      end
    end
    GsuiteMailingLists.sync_group("delegates@worldcubeassociation.org", delegate_emails.uniq)
    GsuiteMailingLists.sync_group("trainees@worldcubeassociation.org", trainee_emails.uniq)
    GsuiteMailingLists.sync_group("seniors@worldcubeassociation.org", senior_emails.uniq)

    organizations_emails = [RegionalOrganization.currently_acknowledged.map(&:email), GroupsMetadataBoard.email].flatten
    GsuiteMailingLists.sync_group("organizations@worldcubeassociation.org", organizations_emails)
  end
end
