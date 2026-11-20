# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CreateWcifRevisionJob do
  let(:competition) { create(:competition, :with_delegate, :with_competitor_limit, :visible) }
  let(:delegate) { competition.delegates.first }
  let(:other_user) { create(:user) }
  let(:oauth_application) { create(:oauth_application) }

  def latest_wcif_json
    competition.to_wcif(version: Competition::WCIF_VERSION_CATALOGUE[:latest]).to_json
  end

  it "stores the current WCIF as the first revision" do
    CreateWcifRevisionJob.perform_now(competition, delegate, nil)

    revision = competition.wcif_revisions.sole
    expect(revision.revision_number).to eq 1
    expect(revision.edited_by).to eq delegate
    expect(revision.oauth_application).to be_nil
    expect(revision.wcif_json).to eq latest_wcif_json
  end

  it "does not store private person data" do
    CreateWcifRevisionJob.perform_now(competition, delegate, nil)

    delegate_wcif = JSON.parse(competition.wcif_revisions.sole.wcif_json)["persons"].find { it["wcaUserId"] == delegate.id }
    expect(delegate_wcif).not_to include("email", "birthdate")
  end

  it "skips a WCIF identical to the latest revision" do
    CreateWcifRevisionJob.perform_now(competition, delegate, nil)

    expect do
      CreateWcifRevisionJob.perform_now(competition, other_user, nil)
    end.not_to(change { competition.wcif_revisions.count })
  end

  it "merges into the latest revision for the same user and app within the merge window" do
    CreateWcifRevisionJob.perform_now(competition, delegate, oauth_application)
    competition.update!(competitor_limit: 150)

    expect do
      CreateWcifRevisionJob.perform_now(competition, delegate, oauth_application)
    end.not_to(change { competition.wcif_revisions.count })
    expect(competition.wcif_revisions.sole.wcif_json).to eq latest_wcif_json
  end

  it "creates a new revision after the merge window" do
    CreateWcifRevisionJob.perform_now(competition, delegate, nil)
    competition.update!(competitor_limit: 150)

    travel WcifRevision::MERGE_WINDOW + 1.second do
      CreateWcifRevisionJob.perform_now(competition, delegate, nil)
    end

    expect(competition.wcif_revisions.pluck(:revision_number)).to eq [1, 2]
  end

  it "creates a new revision for a different user" do
    CreateWcifRevisionJob.perform_now(competition, delegate, nil)
    competition.update!(competitor_limit: 150)
    CreateWcifRevisionJob.perform_now(competition, other_user, nil)

    expect(competition.wcif_revisions.map(&:edited_by)).to eq [delegate, other_user]
  end

  it "creates a new revision for a different app" do
    CreateWcifRevisionJob.perform_now(competition, delegate, nil)
    competition.update!(competitor_limit: 150)
    CreateWcifRevisionJob.perform_now(competition, delegate, oauth_application)

    expect(competition.wcif_revisions.map(&:oauth_application)).to eq [nil, oauth_application]
  end

  it "deletes the oldest revisions beyond the limit" do
    stub_const("WcifRevision::MAX_REVISIONS", 2)

    CreateWcifRevisionJob.perform_now(competition, delegate, nil)
    competition.update!(competitor_limit: 150)
    CreateWcifRevisionJob.perform_now(competition, other_user, nil)
    competition.update!(competitor_limit: 200)
    CreateWcifRevisionJob.perform_now(competition, delegate, nil)

    expect(competition.wcif_revisions.pluck(:revision_number)).to eq [2, 3]
  end
end
