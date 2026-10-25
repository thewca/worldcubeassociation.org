# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PostResultsJob do
  let(:results_ticket) { create(:competition_result_ticket) }
  let(:competition) { results_ticket.competition }
  let(:wrt_member) { create(:user, :wrt_member) }

  before do
    round = create(:round, competition: competition, number: 2)
    create(:result, competition: competition, event_id: "333", round: round)
  end

  it "posts the results" do
    PostResultsJob.perform_now(competition, wrt_member)

    expect(competition.reload.results_posted_by).to eq wrt_member.id
    expect(results_ticket.reload.status).to eq TicketsCompetitionResult.statuses[:posted]
  end

  it "does not post the results again if they have been posted in the meantime" do
    other_wrt_member = create(:user, :wrt_member)
    CompetitionResultsImport.post_results(competition, other_wrt_member)

    PostResultsJob.perform_now(competition, wrt_member)

    expect(competition.reload.results_posted_by).to eq other_wrt_member.id
  end
end
