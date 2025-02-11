# frozen_string_literal: true

require "rails_helper"

def ranking_condition
  AdvancementConditions::RankingCondition.new(3)
end

RSpec.describe "WCA Live API" do
  describe "Advancing Recomputation" do
    context 'with a ranking advancement condition' do
      it 'returns results with ranking better or equal to the given level' do
        competition = FactoryBot.create(:competition, event_ids: ["333"])
        round = FactoryBot.create(:round, number: 1, total_number_of_rounds: 2, event_id: "333", advancement_condition: ranking_condition, competition: competition)

        registrations = Array.new(5) { |i| FactoryBot.create(:registration, event_ids: ["333"], competition: competition, competing_status: "accepted") }

        expect(round.total_registrations).to eq 5

        5.times do |i|
          FactoryBot.create(:live_result, registration: registrations[i], round: round, ranking: i + 1, average: (i + 1) * 100)
        end

        expect(round.live_results.pluck(:advancing)).to eq([true, true, true, false, false])
      end
    end
  end
end
