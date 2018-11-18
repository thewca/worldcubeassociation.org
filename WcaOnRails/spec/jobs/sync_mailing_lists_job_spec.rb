# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SyncMailingListsJob, type: :job do
  it "syncs mailing lists" do
    # delegates@ mailing list
    delegate = FactoryBot.create :delegate
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates@worldcubeassociation.org",
      a_collection_containing_exactly(delegate, delegate.senior_delegate),
    )

    # leaders@ mailing list
    wrt_leader = FactoryBot.create :user, :wrt_member, team_leader: true
    wrt_member = FactoryBot.create :user, :wrt_member, team_leader: false
    wdc_leader = FactoryBot.create :user, :wdc_member, team_leader: true
    FactoryBot.create :user, :wdc_member, team_leader: false
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "leaders@worldcubeassociation.org",
      a_collection_containing_exactly(wrt_leader, wdc_leader),
    )

    # results@ mailing list
    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "results@worldcubeassociation.org",
      a_collection_containing_exactly(wrt_leader, wrt_member),
    )

    SyncMailingListsJob.perform_now
  end
end
