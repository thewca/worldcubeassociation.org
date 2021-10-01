# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SyncMailingListsJob, type: :job do
  it "syncs mailing lists" do
    # delegates@ mailing list
    candidate_delegate = FactoryBot.create :candidate_delegate
    delegate = FactoryBot.create :delegate
    senior_delegate = FactoryBot.create :senior_delegate
    africa_delegate = FactoryBot.create :delegate
    africa_delegate.senior_delegate.update(region: "Africa (France)")
    asia_east_delegate = FactoryBot.create :delegate
    asia_east_delegate.senior_delegate.update(region: "Asia East (Fujian, China)")
    asia_southeast_delegate = FactoryBot.create :delegate
    asia_southeast_delegate.senior_delegate.update(region: "Asia Southeast (Philippines)")
    asia_west_south_delegate = FactoryBot.create :delegate
    asia_west_south_delegate.senior_delegate.update(region: "Asia West & South (India)")
    europe_central_eurasia_delegate = FactoryBot.create :delegate
    europe_central_eurasia_delegate.senior_delegate.update(region: "Central Eurasia (Ukraine)")
    europe_delegate = FactoryBot.create :delegate
    europe_delegate.senior_delegate.update(region: "Europe (Germany)")
    latin_america_delegate = FactoryBot.create :delegate
    latin_america_delegate.senior_delegate.update(region: "Latin America (Peru)")
    oceania_delegate = FactoryBot.create :delegate
    oceania_delegate.senior_delegate.update(region: "Oceania (Australia, Victoria)")
    usa_canada_delegate = FactoryBot.create :delegate
    usa_canada_delegate.senior_delegate.update(region: "USA & Canada (USA, Oregon)")

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates@worldcubeassociation.org",
      a_collection_containing_exactly(candidate_delegate.email, candidate_delegate.senior_delegate.email,
                                      delegate.email, delegate.senior_delegate.email, senior_delegate.email, africa_delegate.email,
                                      africa_delegate.senior_delegate.email, asia_east_delegate.email, asia_east_delegate.senior_delegate.email,
                                      asia_southeast_delegate.email, asia_southeast_delegate.senior_delegate.email,
                                      asia_west_south_delegate.email, asia_west_south_delegate.senior_delegate.email,
                                      europe_central_eurasia_delegate.email, europe_central_eurasia_delegate.senior_delegate.email,
                                      europe_delegate.email, europe_delegate.senior_delegate.email, latin_america_delegate.email,
                                      latin_america_delegate.senior_delegate.email, oceania_delegate.email, oceania_delegate.senior_delegate.email,
                                      usa_canada_delegate.email, usa_canada_delegate.senior_delegate.email),
    )

    # seniors@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "seniors@worldcubeassociation.org",
      a_collection_containing_exactly(candidate_delegate.senior_delegate.email, delegate.senior_delegate.email,
                                      senior_delegate.email, africa_delegate.senior_delegate.email, asia_east_delegate.senior_delegate.email,
                                      asia_southeast_delegate.senior_delegate.email,
                                      asia_west_south_delegate.senior_delegate.email, europe_central_eurasia_delegate.senior_delegate.email,
                                      europe_delegate.senior_delegate.email,
                                      latin_america_delegate.senior_delegate.email, oceania_delegate.senior_delegate.email, usa_canada_delegate.senior_delegate.email),
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
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "leaders@worldcubeassociation.org",
      a_collection_containing_exactly(wrt_leader.email, wdc_leader.email, wfc_leader.email),
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
      a_collection_containing_exactly("seniors@worldcubeassociation.org", "quality@worldcubeassociation.org", "regulations@worldcubeassociation.org", candidate_delegate.email, wdc_leader.email, wdc_member.email, wec_member.email),
    )

    # advisory@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "advisory@worldcubeassociation.org",
      a_collection_containing_exactly(wac_leader.email, wac_member.email),
    )

    # delegates.africa@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.africa@worldcubeassociation.org",
      a_collection_containing_exactly(africa_delegate.email, africa_delegate.senior_delegate.email),
    )

    # delegates.asia-east@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.asia-east@worldcubeassociation.org",
      a_collection_containing_exactly(asia_east_delegate.email, asia_east_delegate.senior_delegate.email),
    )

    # delegates.asia-southeast@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.asia-southeast@worldcubeassociation.org",
      a_collection_containing_exactly(asia_southeast_delegate.email, asia_southeast_delegate.senior_delegate.email),
    )

    # delegates.asia-west-south@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.asia-west-south@worldcubeassociation.org",
      a_collection_containing_exactly(asia_west_south_delegate.email, asia_west_south_delegate.senior_delegate.email),
    )

    # delegates.central-eurasia@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.central-eurasia@worldcubeassociation.org",
      a_collection_containing_exactly(europe_central_eurasia_delegate.email, europe_central_eurasia_delegate.senior_delegate.email),
    )

    # delegates.europe@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.europe@worldcubeassociation.org",
      a_collection_containing_exactly(europe_delegate.email, europe_delegate.senior_delegate.email),
    )

    # delegates.latin-america@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.latin-america@worldcubeassociation.org",
      a_collection_containing_exactly(latin_america_delegate.email, latin_america_delegate.senior_delegate.email),
    )

    # delegates.oceania@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.oceania@worldcubeassociation.org",
      a_collection_containing_exactly(oceania_delegate.email, oceania_delegate.senior_delegate.email),
    )

    # delegates.usa-canada@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates.usa-canada@worldcubeassociation.org",
      a_collection_containing_exactly(usa_canada_delegate.email, usa_canada_delegate.senior_delegate.email),
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
