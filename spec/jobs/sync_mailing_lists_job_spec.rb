# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SyncMailingListsJob, type: :job do
  it "syncs mailing lists" do
    # Regions
    africa_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'africa').user_group
    asia_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group
    europe_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'europe').user_group
    oceania_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'oceania').user_group
    americas_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'americas').user_group

    # Senior delegates
    africa_senior_delegate = FactoryBot.create :senior_delegate_role, group: africa_region
    asia_senior_delegate = FactoryBot.create :senior_delegate_role, group: asia_region
    europe_senior_delegate = FactoryBot.create :senior_delegate_role, group: europe_region
    oceania_senior_delegate = FactoryBot.create :senior_delegate_role, group: oceania_region
    americas_senior_delegate = FactoryBot.create :senior_delegate_role, group: americas_region

    # Africa delegates
    africa_delegate_1 = FactoryBot.create :delegate_role, group: africa_region
    africa_delegate_2 = FactoryBot.create :delegate_role, group: africa_region
    africa_delegate_3 = FactoryBot.create :junior_delegate_role, group: africa_region
    africa_delegate_4 = FactoryBot.create :trainee_delegate_role, group: africa_region

    # Asia delegates
    asia_delegate_1 = FactoryBot.create :delegate_role, group: asia_region
    asia_delegate_2 = FactoryBot.create :delegate_role, group: asia_region
    asia_delegate_3 = FactoryBot.create :junior_delegate_role, group: asia_region
    asia_delegate_4 = FactoryBot.create :trainee_delegate_role, group: asia_region

    # Europe delegates
    europe_delegate_1 = FactoryBot.create :delegate_role, group: europe_region
    europe_delegate_2 = FactoryBot.create :delegate_role, group: europe_region
    europe_delegate_3 = FactoryBot.create :junior_delegate_role, group: europe_region
    europe_delegate_4 = FactoryBot.create :trainee_delegate_role, group: europe_region

    # Oceania delegates
    oceania_delegate_1 = FactoryBot.create :delegate_role, group: oceania_region
    oceania_delegate_2 = FactoryBot.create :delegate_role, group: oceania_region
    oceania_delegate_3 = FactoryBot.create :junior_delegate_role, group: oceania_region
    oceania_delegate_4 = FactoryBot.create :trainee_delegate_role, group: oceania_region

    # Americas delegates
    americas_delegate_1 = FactoryBot.create :delegate_role, group: americas_region
    americas_delegate_2 = FactoryBot.create :delegate_role, group: americas_region
    americas_delegate_3 = FactoryBot.create :junior_delegate_role, group: americas_region
    americas_delegate_4 = FactoryBot.create :trainee_delegate_role, group: americas_region

    # Translators
    translators_group = GroupsMetadataTranslators.find_by!(locale: 'ca').user_group
    translator_1 = FactoryBot.create :translator_role, group_id: translators_group.id
    translator_2 = FactoryBot.create :translator_role, group_id: translators_group.id
    translator_3 = FactoryBot.create :translator_role, group_id: translators_group.id

    # leaders@ mailing list
    wct_member = FactoryBot.create :user, :wct_member, team_leader: false
    wct_china_member = FactoryBot.create :user, :wct_china_member, team_leader: false
    wcat_member = FactoryBot.create :user, :wcat_member, team_leader: false
    wdc_leader = FactoryBot.create :user, :wdc_member, team_leader: true, receive_delegate_reports: true
    wdc_member = FactoryBot.create :user, :wdc_member, team_leader: false, receive_delegate_reports: true
    wec_member = FactoryBot.create :user, :wec_member, team_leader: false, receive_delegate_reports: true
    weat_member = FactoryBot.create :user, :weat_member, team_leader: false
    wfc_member = FactoryBot.create :user, :wfc_member, team_leader: false
    wfc_leader = FactoryBot.create :user, :wfc_member, team_leader: true
    wmt_member = FactoryBot.create :user, :wmt_member, team_leader: false
    wqac_member = FactoryBot.create :user, :wqac_member, team_leader: false
    wrc_member = FactoryBot.create :user, :wrc_member, team_leader: false
    wrt_leader = FactoryBot.create :user, :wrt_member, team_leader: true
    wrt_member = FactoryBot.create :user, :wrt_member, team_leader: false
    wst_member = FactoryBot.create :user, :wst_member, team_leader: false
    wst_admin_member = FactoryBot.create :user, :wst_admin_member, team_leader: false
    wac_member = FactoryBot.create :wac_role_member
    wac_leader = FactoryBot.create :wac_role_leader
    wsot_member = FactoryBot.create :user, :wsot_member, team_leader: false
    wsot_leader = FactoryBot.create :user, :wsot_member, team_leader: true
    wat_member = FactoryBot.create :user, :wat_member, team_leader: false
    wat_leader = FactoryBot.create :user, :wat_member, team_leader: true

    # organizations@ mailing list
    regional_organization = FactoryBot.create :regional_organization
    previously_acknowledged_regional_organization = FactoryBot.create :regional_organization
    previously_acknowledged_regional_organization.update(start_date: 2.days.ago, end_date: 1.days.ago)

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "leaders@worldcubeassociation.org",
      a_collection_containing_exactly(wrt_leader.email, wdc_leader.email, wfc_leader.email, wsot_leader.email, wat_leader.email),
    )

    # board@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "board@worldcubeassociation.org",
      a_collection_containing_exactly(*UserGroup.board.flat_map(&:active_users).map(&:email)),
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
                                      africa_delegate_3.user.email, africa_delegate_4.user.email,
                                      asia_delegate_3.user.email, asia_delegate_4.user.email,
                                      europe_delegate_3.user.email, europe_delegate_4.user.email,
                                      oceania_delegate_3.user.email, oceania_delegate_4.user.email,
                                      americas_delegate_3.user.email, americas_delegate_4.user.email,
                                      wdc_leader.email, wdc_member.email, wec_member.email),
    )

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

    # disciplinary@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "disciplinary@worldcubeassociation.org",
      a_collection_containing_exactly(wdc_leader.email, wdc_member.email),
    )

    # ethics@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "ethics@worldcubeassociation.org",
      a_collection_containing_exactly(wec_member.email),
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

    # advisory@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "advisory@worldcubeassociation.org",
      a_collection_containing_exactly(wac_leader.user.email, wac_member.user.email),
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

    # treasurer@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "treasurer@worldcubeassociation.org",
      a_collection_containing_exactly(*UserGroup.officer_group_treasurers.map(&:user).map(&:email)),
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

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "organizations@worldcubeassociation.org",
      a_collection_containing_exactly(GroupsMetadataBoard.email, regional_organization.email),
    )

    SyncMailingListsJob.perform_now
  end
end
