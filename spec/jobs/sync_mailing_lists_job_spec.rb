# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SyncMailingListsJob do
  it "syncs mailing lists" do
    # Regions
    africa_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group
    asia_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group
    europe_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe').user_group
    oceania_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'oceania').user_group
    americas_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'americas').user_group

    # Senior delegates
    africa_senior_delegate = create(:senior_delegate_role, group: africa_region)
    asia_senior_delegate = create(:senior_delegate_role, group: asia_region)
    europe_senior_delegate = create(:senior_delegate_role, group: europe_region)
    oceania_senior_delegate = create(:senior_delegate_role, group: oceania_region)
    americas_senior_delegate = create(:senior_delegate_role, group: americas_region)

    # Africa delegates
    reports_region_sample = Country.c_find!('Zimbabwe')
    africa_delegate_1 = create(:regional_delegate_role, group: africa_region)
    africa_delegate_1.user.update!(receive_delegate_reports: true)
    africa_delegate_2 = create(:delegate_role, group: africa_region)
    africa_delegate_2.user.update!(receive_delegate_reports: true, delegate_reports_region: reports_region_sample.continent)
    africa_delegate_3 = create(:junior_delegate_role, group: africa_region)
    africa_delegate_3.user.update!(receive_delegate_reports: true, delegate_reports_region: reports_region_sample)
    africa_delegate_4 = create(:trainee_delegate_role, group: africa_region)

    # Asia delegates
    asia_delegate_1 = create(:regional_delegate_role, group: asia_region)
    asia_delegate_2 = create(:delegate_role, group: asia_region)
    asia_delegate_3 = create(:junior_delegate_role, group: asia_region)
    asia_delegate_4 = create(:trainee_delegate_role, group: asia_region)

    # Europe delegates
    europe_delegate_1 = create(:regional_delegate_role, group: europe_region)
    europe_delegate_2 = create(:delegate_role, group: europe_region)
    europe_delegate_3 = create(:junior_delegate_role, group: europe_region)
    europe_delegate_4 = create(:trainee_delegate_role, group: europe_region)

    # Oceania delegates
    oceania_delegate_1 = create(:regional_delegate_role, group: oceania_region)
    oceania_delegate_2 = create(:delegate_role, group: oceania_region)
    oceania_delegate_3 = create(:junior_delegate_role, group: oceania_region)
    oceania_delegate_4 = create(:trainee_delegate_role, group: oceania_region)

    # Americas delegates
    americas_delegate_1 = create(:regional_delegate_role, group: americas_region)
    americas_delegate_2 = create(:delegate_role, group: americas_region)
    americas_delegate_3 = create(:junior_delegate_role, group: americas_region)
    americas_delegate_4 = create(:trainee_delegate_role, group: americas_region)

    # Translators
    translators_group = GroupsMetadataTranslators.find_by!(locale: 'ca').user_group
    translator_1 = create(:translator_role, group_id: translators_group.id)
    translator_2 = create(:translator_role, group_id: translators_group.id)
    translator_3 = create(:translator_role, group_id: translators_group.id)

    # leaders@ mailing list
    board_member = create(:user, :board_member)
    wct_member = create(:user, :wct_member)
    wct_china_member = create(:user, :wct_china_member)
    wcat_member = create(:user, :wcat_member)
    wic_leader = create(:user, :wic_leader, receive_delegate_reports: true)
    wic_member = create(:user, :wic_member, receive_delegate_reports: true)
    weat_member = create(:user, :weat_member)
    wfc_member = create(:user, :wfc_member)
    wfc_leader = create(:user, :wfc_leader)
    wmt_member = create(:user, :wmt_member)
    wqac_member = create(:user, :wqac_member)
    wrc_member = create(:user, :wrc_member)
    wrt_leader = create(:user, :wrt_leader)
    wrt_member = create(:user, :wrt_member)
    wst_member = create(:user, :wst_member)
    wst_admin_member = create(:user, :wst_admin_member)
    wsot_member = create(:user, :wsot_member)
    wsot_leader = create(:user, :wsot_leader)
    wat_member = create(:user, :wat_member)
    wat_leader = create(:user, :wat_leader)
    wapc_member = create(:user, :wapc_member)
    treasurer_role = create(:treasurer_role)

    # organizations@ mailing list
    regional_organization = create(:regional_organization)
    previously_acknowledged_regional_organization = create(:regional_organization)
    previously_acknowledged_regional_organization.update(start_date: 2.days.ago, end_date: 1.day.ago)

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "leaders@worldcubeassociation.org",
      a_collection_containing_exactly(wrt_leader.email, wic_leader.email, wfc_leader.email, wsot_leader.email, wat_leader.email),
    )

    # board@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "board@worldcubeassociation.org",
      a_collection_containing_exactly(board_member.email, SyncMailingListsJob::EXECUTIVE_DIRECTOR_EMAIL),
    )

    # communication-china@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "communication-china@worldcubeassociation.org",
      a_collection_containing_exactly(wct_china_member.email),
    )

    # reports@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "reports@worldcubeassociation.org",
      a_collection_containing_exactly("seniors@worldcubeassociation.org", "quality@worldcubeassociation.org", "regulations@worldcubeassociation.org",
                                      africa_delegate_1.user.email, wic_leader.email, wic_member.email),
    )

    Continent.uncached_real.each do |continent|
      continent_users = continent.id == reports_region_sample.continent_id ? [africa_delegate_2.user] : []

      expect(GsuiteMailingLists).to receive(:sync_group).with(
        "reports.#{continent.url_id}@worldcubeassociation.org",
        a_collection_containing_exactly("reports@worldcubeassociation.org", *continent_users.pluck(:email)),
      )

      continent.countries.uncached_real.each do |country|
        country_users = country.id == reports_region_sample.id ? [africa_delegate_3.user] : []

        expect(GsuiteMailingLists).to receive(:sync_group).with(
          "reports.#{continent.url_id}.#{country.iso2}@worldcubeassociation.org",
          a_collection_containing_exactly("reports.#{continent.url_id}@worldcubeassociation.org", *country_users.pluck(:email)),
        )
      end
    end

    # communication@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "communication@worldcubeassociation.org",
      a_collection_containing_exactly(wct_member.email),
    )

    # competitions@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "competitions@worldcubeassociation.org",
      a_collection_containing_exactly(wcat_member.email),
    )

    # integrity@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "integrity@worldcubeassociation.org",
      a_collection_containing_exactly(wic_leader.email, wic_member.email),
    )

    # assistants@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "assistants@worldcubeassociation.org",
      a_collection_containing_exactly(weat_member.email),
    )

    # finance@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "finance@worldcubeassociation.org",
      a_collection_containing_exactly(wfc_member.email, wfc_leader.email),
    )

    # marketing@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "marketing@worldcubeassociation.org",
      a_collection_containing_exactly(wmt_member.email),
    )

    # quality@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "quality@worldcubeassociation.org",
      a_collection_containing_exactly(wqac_member.email),
    )

    # regulations@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "regulations@worldcubeassociation.org",
      a_collection_containing_exactly(wrc_member.email),
    )

    # results@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "results@worldcubeassociation.org",
      a_collection_containing_exactly(wrt_leader.email, wrt_member.email),
    )

    # software@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "software@worldcubeassociation.org",
      a_collection_containing_exactly(wst_member.email),
    )

    # software-admin@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "software-admin@worldcubeassociation.org",
      a_collection_containing_exactly(wst_admin_member.email),
    )

    # translators@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "translators@worldcubeassociation.org",
      a_collection_containing_exactly(translator_1.user.email, translator_2.user.email, translator_3.user.email),
    )

    # sports@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "sports@worldcubeassociation.org",
      a_collection_containing_exactly(wsot_leader.email, wsot_member.email),
    )

    # archive@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "archive@worldcubeassociation.org",
      a_collection_containing_exactly(wat_leader.email, wat_member.email),
    )

    # appeals@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "appeals@worldcubeassociation.org",
      a_collection_containing_exactly(wapc_member.email),
    )

    # ethics@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "ethics@worldcubeassociation.org",
      a_collection_containing_exactly(wic_leader.email, wic_member.email),
    )

    # treasurer@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "treasurer@worldcubeassociation.org",
      a_collection_containing_exactly(treasurer_role.user.email),
    )

    # delegates.africa@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.africa@worldcubeassociation.org",
      a_collection_containing_exactly(africa_senior_delegate.user.email, africa_delegate_1.user.email, africa_delegate_2.user.email, africa_delegate_3.user.email, africa_delegate_4.user.email),
    )

    # delegates.asia@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.asia@worldcubeassociation.org",
      a_collection_containing_exactly(asia_senior_delegate.user.email, asia_delegate_1.user.email, asia_delegate_2.user.email, asia_delegate_3.user.email, asia_delegate_4.user.email),
    )

    # delegates.europe@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.europe@worldcubeassociation.org",
      a_collection_containing_exactly(europe_senior_delegate.user.email, europe_delegate_1.user.email, europe_delegate_2.user.email, europe_delegate_3.user.email, europe_delegate_4.user.email),
    )

    # delegates.oceania@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.oceania@worldcubeassociation.org",
      a_collection_containing_exactly(oceania_senior_delegate.user.email, oceania_delegate_1.user.email, oceania_delegate_2.user.email, oceania_delegate_3.user.email, oceania_delegate_4.user.email),
    )

    # delegates.americas@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.americas@worldcubeassociation.org",
      a_collection_containing_exactly(americas_senior_delegate.user.email, americas_delegate_1.user.email, americas_delegate_2.user.email, americas_delegate_3.user.email, americas_delegate_4.user.email),
    )

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates@worldcubeassociation.org",
      a_collection_containing_exactly(
        africa_senior_delegate.user.email, africa_delegate_1.user.email, africa_delegate_2.user.email, africa_delegate_3.user.email,
        asia_senior_delegate.user.email, asia_delegate_1.user.email, asia_delegate_2.user.email, asia_delegate_3.user.email,
        europe_senior_delegate.user.email, europe_delegate_1.user.email, europe_delegate_2.user.email, europe_delegate_3.user.email,
        oceania_senior_delegate.user.email, oceania_delegate_1.user.email, oceania_delegate_2.user.email, oceania_delegate_3.user.email,
        americas_senior_delegate.user.email, americas_delegate_1.user.email, americas_delegate_2.user.email, americas_delegate_3.user.email
      ),
    )

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "trainees@worldcubeassociation.org",
      a_collection_containing_exactly(
        africa_delegate_4.user.email, asia_delegate_4.user.email, europe_delegate_4.user.email, oceania_delegate_4.user.email, americas_delegate_4.user.email
      ),
    )

    # seniors@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "seniors@worldcubeassociation.org",
      a_collection_containing_exactly(
        africa_senior_delegate.user.email, asia_senior_delegate.user.email, europe_senior_delegate.user.email, oceania_senior_delegate.user.email, americas_senior_delegate.user.email
      ),
    )

    # seniors@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "regionals@worldcubeassociation.org",
      a_collection_containing_exactly(
        africa_delegate_1.user.email, asia_delegate_1.user.email, europe_delegate_1.user.email, oceania_delegate_1.user.email, americas_delegate_1.user.email
      ),
    )

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "organizations@worldcubeassociation.org",
      a_collection_containing_exactly(GroupsMetadataBoard.email, regional_organization.email),
    )

    SyncMailingListsJob.perform_now
  end
end
