# frozen_string_literal: true

require "rails_helper"

RSpec.describe "competitions/show", type: :feature, js: true do
  let(:competition) { FactoryBot.create(:competition, :visible, event_ids: %w(333 444)) }
  let(:sixty_second_2_attempt_cutoff) { Cutoff.new(number_of_attempts: 2, attempt_result: 1.minute.in_centiseconds) }
  let(:top_16_advance) { AdvancementConditions::RankingCondition.new(16) }
  let!(:round333_1) { FactoryBot.create(:round, competition: competition, event_id: "333", number: 1, cutoff: sixty_second_2_attempt_cutoff, advancement_condition: top_16_advance, total_number_of_rounds: 2) }
  let!(:round333_2) { FactoryBot.create(:round, competition: competition, event_id: "333", number: 2, total_number_of_rounds: 2) }
  let!(:round444_1) { FactoryBot.create(:round, competition: competition, event_id: "444", number: 1) }

  before do
    # Load all the rounds we just created.
    competition.reload
  end

  it "renders advancement condition for 333 round 1" do
    visit competition_path(competition, anchor: 'competition-events')
    expect(page).to have_text('Top 16 advance to next round')
  end
end
