# frozen_string_literal: true

require 'rails_helper'
require 'rake'

RSpec.describe "import:h2h_data", type: :task do
  before(:all) do
    Rake.application.rake_require "tasks/h2h_results_import"
    Rake::Task.define_task(:environment)
  end

  let!(:competition) { create(:competition, :with_valid_schedule, h2h_finals_event_ids: ['333']) }
  let!(:registrations) { create_list(:registration, 8, competition: competition)}
  let!(:round) { competition.competition_events.where(event_id: "333").first.rounds.first }
  let!(:registration_ids) { Registration.pluck(:id) }

  let(:csv_content) do
    <<~CSV
      round_id,Match # ,Set #,Attempt number,registration_id,final_position,Time (seconds)
      #{round.id},1,1,1,#{registration_ids[0]},4,5.48
      #{round.id},1,1,1,#{registration_ids[1]},5,6.74
      #{round.id},1,1,2,#{registration_ids[1]},5,12.48
      #{round.id},1,1,2,#{registration_ids[0]},4,19.93
      #{round.id},1,1,3,#{registration_ids[0]},4,15.43
      #{round.id},1,1,3,#{registration_ids[1]},5,18.80
      #{round.id},1,1,4,#{registration_ids[0]},4,6.83
      #{round.id},1,1,4,#{registration_ids[1]},5,18.27
      #{round.id},2,1,1,#{registration_ids[4]},5,9.74
      #{round.id},2,1,1,#{registration_ids[5]},1,14.38
      #{round.id},2,1,2,#{registration_ids[5]},1,8.25
      #{round.id},2,1,2,#{registration_ids[4]},5,12.99
      #{round.id},2,1,3,#{registration_ids[5]},1,10.67
      #{round.id},2,1,3,#{registration_ids[4]},5,15.23
      #{round.id},2,1,4,#{registration_ids[5]},1,6.04
      #{round.id},2,1,4,#{registration_ids[4]},5,18.96
      #{round.id},3,1,1,#{registration_ids[2]},3,8.23
      #{round.id},3,1,1,#{registration_ids[7]},5,11.23
      #{round.id},3,1,2,#{registration_ids[7]},5,8.89
      #{round.id},3,1,2,#{registration_ids[2]},3,9.07
      #{round.id},3,1,3,#{registration_ids[2]},3,14.54
      #{round.id},3,1,3,#{registration_ids[7]},5,17.65
      #{round.id},3,1,4,#{registration_ids[7]},5,13.98
      #{round.id},3,1,4,#{registration_ids[2]},3,19.56
      #{round.id},3,1,5,#{registration_ids[2]},3,7.05
      #{round.id},3,1,5,#{registration_ids[7]},5,10.74
      #{round.id},4,1,1,#{registration_ids[3]},2,9.03
      #{round.id},4,1,1,#{registration_ids[6]},5,15.79
      #{round.id},4,1,2,#{registration_ids[3]},2,8.95
      #{round.id},4,1,2,#{registration_ids[6]},5,17.11
      #{round.id},4,1,3,#{registration_ids[3]},2,6.28
      #{round.id},4,1,3,#{registration_ids[6]},5,7.53
      #{round.id},5,1,1,#{registration_ids[0]},4,17.08
      #{round.id},5,1,1,#{registration_ids[5]},1,18.36
      #{round.id},5,1,2,#{registration_ids[0]},4,6.2
      #{round.id},5,1,2,#{registration_ids[5]},1,7.29
      #{round.id},5,1,3,#{registration_ids[5]},1,15.01
      #{round.id},5,1,3,#{registration_ids[0]},4,19.89
      #{round.id},5,1,4,#{registration_ids[0]},4,13.6
      #{round.id},5,1,4,#{registration_ids[5]},1,16.94
      #{round.id},5,2,1,#{registration_ids[0]},4,8.86
      #{round.id},5,2,1,#{registration_ids[5]},1,14.23
      #{round.id},5,2,2,#{registration_ids[5]},1,6.83
      #{round.id},5,2,2,#{registration_ids[0]},4,7.05
      #{round.id},5,2,3,#{registration_ids[5]},1,5.15
      #{round.id},5,2,3,#{registration_ids[0]},4,14.08
      #{round.id},5,2,4,#{registration_ids[5]},1,8.41
      #{round.id},5,2,4,#{registration_ids[0]},4,15.93
      #{round.id},5,3,1,#{registration_ids[5]},1,9.71
      #{round.id},5,3,1,#{registration_ids[0]},4,13.16
      #{round.id},5,3,2,#{registration_ids[5]},1,8.47
      #{round.id},5,3,2,#{registration_ids[0]},4,17.42
      #{round.id},5,3,3,#{registration_ids[5]},1,8.44
      #{round.id},5,3,3,#{registration_ids[0]},4,14.26
      #{round.id},6,1,1,#{registration_ids[3]},2,9.97
      #{round.id},6,1,1,#{registration_ids[2]},3,10.68
      #{round.id},6,1,2,#{registration_ids[3]},2,15.24
      #{round.id},6,1,2,#{registration_ids[2]},3,19.17
      #{round.id},6,1,3,#{registration_ids[2]},3,7.5
      #{round.id},6,1,3,#{registration_ids[3]},2,11.82
      #{round.id},6,1,4,#{registration_ids[2]},3,15.81
      #{round.id},6,1,4,#{registration_ids[3]},2,18.53
      #{round.id},6,1,5,#{registration_ids[3]},2,9.94
      #{round.id},6,1,5,#{registration_ids[2]},3,12.36
      #{round.id},6,2,1,#{registration_ids[3]},2,7.48
      #{round.id},6,2,1,#{registration_ids[2]},3,16.5
      #{round.id},6,2,2,#{registration_ids[3]},2,14.95
      #{round.id},6,2,2,#{registration_ids[2]},3,18.18
      #{round.id},6,2,3,#{registration_ids[3]},2,5.12
      #{round.id},6,2,3,#{registration_ids[2]},3,8.75
      #{round.id},7,1,1,#{registration_ids[2]},3,6.8
      #{round.id},7,1,1,#{registration_ids[0]},4,10.26
      #{round.id},7,1,2,#{registration_ids[0]},4,8.09
      #{round.id},7,1,2,#{registration_ids[2]},3,17.96
      #{round.id},7,1,3,#{registration_ids[0]},4,7.46
      #{round.id},7,1,3,#{registration_ids[2]},3,10.63
      #{round.id},7,1,4,#{registration_ids[2]},3,7
      #{round.id},7,1,4,#{registration_ids[0]},4,18.7
      #{round.id},7,1,5,#{registration_ids[2]},3,14.57
      #{round.id},7,1,5,#{registration_ids[0]},4,19.77
      #{round.id},7,2,1,#{registration_ids[0]},4,13.22
      #{round.id},7,2,1,#{registration_ids[2]},3,13.82
      #{round.id},7,2,2,#{registration_ids[2]},3,8.63
      #{round.id},7,2,2,#{registration_ids[0]},4,17.95
      #{round.id},7,2,3,#{registration_ids[2]},3,7.99
      #{round.id},7,2,3,#{registration_ids[0]},4,14.08
      #{round.id},7,2,4,#{registration_ids[2]},3,11.79
      #{round.id},7,2,4,#{registration_ids[0]},4,16.79
      #{round.id},8,1,1,#{registration_ids[5]},1,9.37
      #{round.id},8,1,1,#{registration_ids[3]},2,12.32
      #{round.id},8,1,2,#{registration_ids[5]},1,6.19
      #{round.id},8,1,2,#{registration_ids[3]},2,18.4
      #{round.id},8,1,3,#{registration_ids[3]},2,15.12
      #{round.id},8,1,3,#{registration_ids[5]},1,16.35
      #{round.id},8,1,4,#{registration_ids[5]},1,15.75
      #{round.id},8,1,4,#{registration_ids[3]},2,16.35
      #{round.id},8,2,1,#{registration_ids[3]},2,9.93
      #{round.id},8,2,1,#{registration_ids[5]},1,17.1
      #{round.id},8,2,2,#{registration_ids[3]},2,9.44
      #{round.id},8,2,2,#{registration_ids[5]},1,19.11
      #{round.id},8,2,3,#{registration_ids[5]},1,6.47
      #{round.id},8,2,3,#{registration_ids[3]},2,12.18
      #{round.id},8,2,4,#{registration_ids[3]},2,7.72
      #{round.id},8,2,4,#{registration_ids[5]},1,12.95
      #{round.id},8,3,1,#{registration_ids[5]},1,9.9
      #{round.id},8,3,1,#{registration_ids[3]},2,12.42
      #{round.id},8,3,2,#{registration_ids[3]},2,11.08
      #{round.id},8,3,2,#{registration_ids[5]},1,15.75
      #{round.id},8,3,3,#{registration_ids[5]},1,9.85
      #{round.id},8,3,3,#{registration_ids[3]},2,11.7
      #{round.id},8,3,4,#{registration_ids[5]},1,7.85
      #{round.id},8,3,4,#{registration_ids[3]},2,14.35
      #{round.id},8,4,1,#{registration_ids[5]},1,5.46
      #{round.id},8,4,1,#{registration_ids[3]},2,15.01
      #{round.id},8,4,2,#{registration_ids[3]},2,7.96
      #{round.id},8,4,2,#{registration_ids[5]},1,11.24
      #{round.id},8,4,3,#{registration_ids[5]},1,8.4
      #{round.id},8,4,3,#{registration_ids[3]},2,18.63
      #{round.id},8,4,4,#{registration_ids[5]},1,12.62
      #{round.id},8,4,4,#{registration_ids[3]},2,18.97
    CSV
  end

  let(:temp_csv) { Tempfile.new(['test_data', '.csv']) }

  before do
    temp_csv.write(csv_content)
    temp_csv.rewind
  end

  after do
    temp_csv.unlink
  end

  context 'h2h results import' do
    before do
      Rake::Task["h2h_results:import"].reenable
      Rake::Task["h2h_results:import"].invoke(temp_csv.path)
    end

    it 'creates the expected number of model objects', :cxzz do
      expect(LiveResult.count).to be(8)
      expect(Result.count).to be(0)
      expect(H2hMatch.count).to be(8)
      expect(H2hCompetitor.count).to be(16)
      expect(H2hSet.count).to be(15)
      expect(LiveAttempt.count).to be(120)
      expect(ResultAttempt.count).to be(0)
      expect(H2hAttempt.count).to be(120)
      expect(H2hAttempt.where(live_attempt_id: nil).count).to be(0)
      expect(H2hAttempt.where(result_attempt_id: nil).count).to be(120)
    end

    it 'creates valid LiveResults', :cxzx do
      LiveResult.all.each do |lr|
        # populates global and local pos
        expect(lr.global_pos).to be_an_integer
        expect(lr.local_pos).to be_an_integer
        # has unique attempt_numbers for each live_result
        expect(lr.live_attempts.count).to eq(lr.live_attempts.pluck(:attempt_number).uniq.count)
      end
    end
  end

  context 'h2h results posting' do
    it 'creates/deletes the expected number of model objects', :cxz do
      Rake::Task["h2h_results:import"].invoke(temp_csv.path)
      Rake::Task["h2h_results:post"].invoke(competition.id)

      expect(LiveResult.count).to be(0)
      expect(Result.count).to be(8)
      expect(H2hMatch.count).to be(8)
      expect(H2hCompetitor.count).to be(16)
      expect(H2hSet.count).to be(15)
      expect(LiveAttempt.count).to be(0)
      expect(ResultAttempt.count).to be(120)
      expect(H2hAttempt.count).to be(120)
      expect(H2hAttempt.where(live_attempt_id: nil).count).to be(120)
      expect(H2hAttempt.where(result_attempt_id: nil).count).to be(0)
    end

  end
end
