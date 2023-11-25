# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SyncMailingListsJob, type: :job do
  it "syncs mailing lists" do
    # Regions
    africa_region = FactoryBot.create :africa_region
    africa_region.update!(metadata: FactoryBot.create(:user_groups_delegate_regions_metadata, email: "delegates.africa@worldcubeassociation.org"))
    asia_region = FactoryBot.create :asia_region
    asia_region.update!(metadata: FactoryBot.create(:user_groups_delegate_regions_metadata, email: "delegates.asia@worldcubeassociation.org"))
    europe_region = FactoryBot.create :europe_region
    europe_region.update!(metadata: FactoryBot.create(:user_groups_delegate_regions_metadata, email: "delegates.europe@worldcubeassociation.org"))
    north_america_region = FactoryBot.create :north_america_region
    north_america_region.update!(metadata: FactoryBot.create(:user_groups_delegate_regions_metadata, email: "delegates.north-america@worldcubeassociation.org"))

    # Senior delegates
    africa_senior_delegate = FactoryBot.create :senior_delegate, region_id: africa_region.id
    asia_senior_delegate = FactoryBot.create :senior_delegate, region_id: asia_region.id
    europe_senior_delegate = FactoryBot.create :senior_delegate, region_id: europe_region.id
    north_america_senior_delegate = FactoryBot.create :senior_delegate, region_id: north_america_region.id

    # Africa delegates
    africa_delegate_1 = FactoryBot.create :delegate, region_id: africa_region.id
    africa_delegate_2 = FactoryBot.create :delegate, region_id: africa_region.id
    africa_delegate_3 = FactoryBot.create :candidate_delegate, region_id: africa_region.id
    africa_delegate_4 = FactoryBot.create :trainee_delegate, region_id: africa_region.id

    # Asia delegates
    asia_delegate_1 = FactoryBot.create :delegate, region_id: asia_region.id
    asia_delegate_2 = FactoryBot.create :delegate, region_id: asia_region.id
    asia_delegate_3 = FactoryBot.create :candidate_delegate, region_id: asia_region.id
    asia_delegate_4 = FactoryBot.create :trainee_delegate, region_id: asia_region.id

    # Europe delegates
    europe_delegate_1 = FactoryBot.create :delegate, region_id: europe_region.id
    europe_delegate_2 = FactoryBot.create :delegate, region_id: europe_region.id
    europe_delegate_3 = FactoryBot.create :candidate_delegate, region_id: europe_region.id
    europe_delegate_4 = FactoryBot.create :trainee_delegate, region_id: europe_region.id

    # North America delegates
    north_america_delegate_1 = FactoryBot.create :delegate, region_id: north_america_region.id
    north_america_delegate_2 = FactoryBot.create :delegate, region_id: north_america_region.id
    north_america_delegate_3 = FactoryBot.create :candidate_delegate, region_id: north_america_region.id
    north_america_delegate_4 = FactoryBot.create :trainee_delegate, region_id: north_america_region.id

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates@worldcubeassociation.org",
      a_collection_containing_exactly(
        africa_senior_delegate.email, africa_delegate_1.email, africa_delegate_2.email, africa_delegate_3.email,
        asia_senior_delegate.email, asia_delegate_1.email, asia_delegate_2.email, asia_delegate_3.email,
        europe_senior_delegate.email, europe_delegate_1.email, europe_delegate_2.email, europe_delegate_3.email,
        north_america_senior_delegate.email, north_america_delegate_1.email, north_america_delegate_2.email, north_america_delegate_3.email
      ),
    )

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "trainees@worldcubeassociation.org",
      a_collection_containing_exactly(
        africa_delegate_4.email, asia_delegate_4.email, europe_delegate_4.email, north_america_delegate_4.email
      ),
    )

    # seniors@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "seniors@worldcubeassociation.org",
      a_collection_containing_exactly(
        africa_senior_delegate.email, asia_senior_delegate.email, europe_senior_delegate.email, north_america_senior_delegate.email
      ),
    )

    # leaders@ mailing list
    board_member = FactoryBot.create :user, :board_member, team_leader: false
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
    wac_member = FactoryBot.create :user, :wac_member, team_leader: false
    wac_leader = FactoryBot.create :user, :wac_member, team_leader: true
    wsot_member = FactoryBot.create :user, :wsot_member, team_leader: false
    wsot_leader = FactoryBot.create :user, :wsot_member, team_leader: true
    wat_member = FactoryBot.create :user, :wat_member, team_leader: false
    wat_leader = FactoryBot.create :user, :wat_member, team_leader: true
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "leaders@worldcubeassociation.org",
      a_collection_containing_exactly(wrt_leader.email, wdc_leader.email, wfc_leader.email, wsot_leader.email, wat_leader.email),
    )

    # board@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "board@worldcubeassociation.org",
      a_collection_containing_exactly(board_member.email),
    )

    # communication@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "communication@worldcubeassociation.org",
      a_collection_containing_exactly(wct_member.email),
    )

    # communication-china@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "communication-china@worldcubeassociation.org",
      a_collection_containing_exactly(wct_china_member.email),
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

    # treasurer@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "treasurer@worldcubeassociation.org",
      a_collection_containing_exactly(wfc_leader.email),
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

    stub_const "TranslationsController::VERIFIED_TRANSLATORS_BY_LOCALE", ({
      "es" => [wst_member.id],
      "fr" => [wrc_member.id, wrt_leader.id],
    })
    # translators@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "translators@worldcubeassociation.org",
      a_collection_containing_exactly(wst_member.email, wrc_member.email, wrt_leader.email),
    )

    # reports@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "reports@worldcubeassociation.org",
      a_collection_containing_exactly("seniors@worldcubeassociation.org", "quality@worldcubeassociation.org", "regulations@worldcubeassociation.org",
                                      africa_delegate_3.email, africa_delegate_4.email,
                                      asia_delegate_3.email, asia_delegate_4.email,
                                      europe_delegate_3.email, europe_delegate_4.email,
                                      north_america_delegate_3.email, north_america_delegate_4.email,
                                      wdc_leader.email, wdc_member.email, wec_member.email),
    )

    # advisory@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "advisory@worldcubeassociation.org",
      a_collection_containing_exactly(wac_leader.email, wac_member.email),
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

    # delegates.africa@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.africa@worldcubeassociation.org",
      a_collection_containing_exactly(africa_senior_delegate.email, africa_delegate_1.email, africa_delegate_2.email, africa_delegate_3.email, africa_delegate_4.email),
    )

    # delegates.asia@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.asia@worldcubeassociation.org",
      a_collection_containing_exactly(asia_senior_delegate.email, asia_delegate_1.email, asia_delegate_2.email, asia_delegate_3.email, asia_delegate_4.email),
    )

    # delegates.europe@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.europe@worldcubeassociation.org",
      a_collection_containing_exactly(europe_senior_delegate.email, europe_delegate_1.email, europe_delegate_2.email, europe_delegate_3.email, europe_delegate_4.email),
    )

    # delegates.north-america@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.north-america@worldcubeassociation.org",
      a_collection_containing_exactly(north_america_senior_delegate.email, north_america_delegate_1.email, north_america_delegate_2.email, north_america_delegate_3.email, north_america_delegate_4.email),
    )

    # organizations@ mailing list
    regional_organization = FactoryBot.create :regional_organization
    previously_acknowledged_regional_organization = FactoryBot.create :regional_organization
    previously_acknowledged_regional_organization.update(start_date: 2.days.ago, end_date: 1.days.ago)

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "organizations@worldcubeassociation.org",
      a_collection_containing_exactly("board@worldcubeassociation.org", regional_organization.email),
    )

    SyncMailingListsJob.perform_now
  end
end
