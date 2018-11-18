# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SyncMailingListsJob, type: :job do
  it "syncs delegates mailing list" do
    delegate = FactoryBot.create :delegate

    expect(GsuiteMailingLists).to receive(:sync_group).with(
      "delegates@worldcubeassociation.org",
      a_collection_containing_exactly(delegate, delegate.senior_delegate),
    )

    SyncMailingListsJob.perform_now
  end
end
