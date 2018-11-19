# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SyncMailingListsJob, type: :job do
  it "syncs mailing lists" do
    # candidates@ mailing list
    candidate_delegate = FactoryBot.create :candidate_delegate
    delegate = FactoryBot.create :delegate
    senior_delegate = FactoryBot.create :senior_delegate
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "candidates@worldcubeassociation.org",
      a_collection_containing_exactly(candidate_delegate),
    )

    # delegates@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates@worldcubeassociation.org",
      a_collection_containing_exactly(candidate_delegate, candidate_delegate.senior_delegate, delegate, delegate.senior_delegate, senior_delegate),
    )

    # seniors@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "seniors@worldcubeassociation.org",
      a_collection_containing_exactly(candidate_delegate.senior_delegate, delegate.senior_delegate, senior_delegate),
    )

    # leaders@ mailing list
    board_member = FactoryBot.create :user, :board_member, team_leader: false
    wct_member = FactoryBot.create :user, :wct_member, team_leader: false
    wcat_member = FactoryBot.create :user, :wcat_member, team_leader: false
    wdc_leader = FactoryBot.create :user, :wdc_member, team_leader: true
    wdc_member = FactoryBot.create :user, :wdc_member, team_leader: false
    wec_member = FactoryBot.create :user, :wec_member, team_leader: false
    wfc_member = FactoryBot.create :user, :wfc_member, team_leader: false
    wmt_member = FactoryBot.create :user, :wmt_member, team_leader: false
    wqac_member = FactoryBot.create :user, :wqac_member, team_leader: false
    wrc_member = FactoryBot.create :user, :wrc_member, team_leader: false
    wrt_leader = FactoryBot.create :user, :wrt_member, team_leader: true
    wrt_member = FactoryBot.create :user, :wrt_member, team_leader: false
    wst_member = FactoryBot.create :user, :wst_member, team_leader: false
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "leaders@worldcubeassociation.org",
      a_collection_containing_exactly(wrt_leader, wdc_leader),
    )

    # board@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "board@worldcubeassociation.org",
      a_collection_containing_exactly(board_member),
    )

    # communication@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "communication@worldcubeassociation.org",
      a_collection_containing_exactly(wct_member),
    )

    # competitions@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "competitions@worldcubeassociation.org",
      a_collection_containing_exactly(wcat_member),
    )

    # disciplinary@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "disciplinary@worldcubeassociation.org",
      a_collection_containing_exactly(wdc_leader, wdc_member),
    )

    # ethics@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "ethics@worldcubeassociation.org",
      a_collection_containing_exactly(wec_member),
    )

    # finance@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "finance@worldcubeassociation.org",
      a_collection_containing_exactly(wfc_member),
    )

    # marketing@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "marketing@worldcubeassociation.org",
      a_collection_containing_exactly(wmt_member),
    )

    # quality@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "quality@worldcubeassociation.org",
      a_collection_containing_exactly(wqac_member),
    )

    # regulations@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "regulations@worldcubeassociation.org",
      a_collection_containing_exactly(wrc_member),
    )

    # results@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "results@worldcubeassociation.org",
      a_collection_containing_exactly(wrt_leader, wrt_member),
    )

    # software@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "software@worldcubeassociation.org",
      a_collection_containing_exactly(wst_member),
    )

    stub_const "TranslationsController::VERIFIED_TRANSLATORS_BY_LOCALE", ({
      "es" => [wst_member.id],
      "fr" => [wrc_member.id, wrt_leader.id],
    })
    # translators@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "translators@worldcubeassociation.org",
      a_collection_containing_exactly(wst_member, wrc_member, wrt_leader),
    )

    SyncMailingListsJob.perform_now
  end
end
