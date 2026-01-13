# frozen_string_literal: true

require 'rails_helper'
require 'rake'

RSpec.describe "import:h2h_data", type: :task do
  before :all do
    Rake.application.rake_require "tasks/h2h_results_import"
    Rake::Task.define_task(:environment)
  end

  let!(:competition) { create(:competition, :with_valid_schedule) }
  let!(:round) { competition.competition_events.where(event_id: "333").first.rounds.first }
  let!(:users) { create_list(:user, 8) }
  let!(:user_ids) { users.pluck(:id) }

  before do
    create_list(:user, 8)
    @user_ids = User.pluck(:id)
  end


  let(:csv_content) do
    <<~CSV
      round_id,Match # ,Set #,Attempt number,user_id,Time (seconds)
      #{round.id},1,1,1,#{user_ids[0]},5.48
      #{round.id},1,1,1,#{user_ids[1]},6.74
      #{round.id},1,1,2,#{user_ids[1]},12.48
      #{round.id},1,1,2,#{user_ids[0]},19.93
      #{round.id},1,1,3,#{user_ids[0]},15.43
      #{round.id},1,1,3,#{user_ids[1]},18.80
      #{round.id},1,1,4,#{user_ids[0]},6.83
      #{round.id},1,1,4,#{user_ids[1]},18.27
      #{round.id},2,1,1,#{user_ids[4]},9.74
      #{round.id},2,1,1,#{user_ids[5]},14.38
      #{round.id},2,1,2,#{user_ids[5]},8.25
      #{round.id},2,1,2,#{user_ids[4]},12.99
      #{round.id},2,1,3,#{user_ids[5]},10.67
      #{round.id},2,1,3,#{user_ids[4]},15.23
      #{round.id},2,1,4,#{user_ids[5]},6.04
      #{round.id},2,1,4,#{user_ids[4]},18.96
      #{round.id},3,1,1,#{user_ids[2]},8.23
      #{round.id},3,1,1,#{user_ids[7]},11.23
      #{round.id},3,1,2,#{user_ids[7]},8.89
      #{round.id},3,1,2,#{user_ids[2]},9.07
      #{round.id},3,1,3,#{user_ids[2]},14.54
      #{round.id},3,1,3,#{user_ids[7]},17.65
      #{round.id},3,1,4,#{user_ids[7]},13.98
      #{round.id},3,1,4,#{user_ids[2]},19.56
      #{round.id},3,1,5,#{user_ids[2]},7.05
      #{round.id},3,1,5,#{user_ids[7]},10.74
      #{round.id},4,1,1,#{user_ids[3]},9.03
      #{round.id},4,1,1,#{user_ids[6]},15.79
      #{round.id},4,1,2,#{user_ids[3]},8.95
      #{round.id},4,1,2,#{user_ids[6]},17.11
      #{round.id},4,1,3,#{user_ids[3]},6.28
      #{round.id},4,1,3,#{user_ids[6]},7.53
      #{round.id},5,1,1,#{user_ids[0]},17.08
      #{round.id},5,1,1,#{user_ids[5]},18.36
      #{round.id},5,1,2,#{user_ids[0]},6.2
      #{round.id},5,1,2,#{user_ids[5]},7.29
      #{round.id},5,1,3,#{user_ids[5]},15.01
      #{round.id},5,1,3,#{user_ids[0]},19.89
      #{round.id},5,1,4,#{user_ids[0]},13.6
      #{round.id},5,1,4,#{user_ids[5]},16.94
      #{round.id},5,2,1,#{user_ids[0]},8.86
      #{round.id},5,2,1,#{user_ids[5]},14.23
      #{round.id},5,2,2,#{user_ids[5]},6.83
      #{round.id},5,2,2,#{user_ids[0]},7.05
      #{round.id},5,2,3,#{user_ids[5]},5.15
      #{round.id},5,2,3,#{user_ids[0]},14.08
      #{round.id},5,2,4,#{user_ids[5]},8.41
      #{round.id},5,2,4,#{user_ids[0]},15.93
      #{round.id},5,3,1,#{user_ids[5]},9.71
      #{round.id},5,3,1,#{user_ids[0]},13.16
      #{round.id},5,3,2,#{user_ids[5]},8.47
      #{round.id},5,3,2,#{user_ids[0]},17.42
      #{round.id},5,3,3,#{user_ids[5]},8.44
      #{round.id},5,3,3,#{user_ids[0]},14.26
      #{round.id},6,1,1,#{user_ids[3]},9.97
      #{round.id},6,1,1,#{user_ids[2]},10.68
      #{round.id},6,1,2,#{user_ids[3]},15.24
      #{round.id},6,1,2,#{user_ids[2]},19.17
      #{round.id},6,1,3,#{user_ids[2]},7.5
      #{round.id},6,1,3,#{user_ids[3]},11.82
      #{round.id},6,1,4,#{user_ids[2]},15.81
      #{round.id},6,1,4,#{user_ids[3]},18.53
      #{round.id},6,1,5,#{user_ids[3]},9.94
      #{round.id},6,1,5,#{user_ids[2]},12.36
      #{round.id},6,2,1,#{user_ids[3]},7.48
      #{round.id},6,2,1,#{user_ids[2]},16.5
      #{round.id},6,2,2,#{user_ids[3]},14.95
      #{round.id},6,2,2,#{user_ids[2]},18.18
      #{round.id},6,2,3,#{user_ids[3]},5.12
      #{round.id},6,2,3,#{user_ids[2]},8.75
      #{round.id},7,1,1,#{user_ids[2]},6.8
      #{round.id},7,1,1,#{user_ids[0]},10.26
      #{round.id},7,1,2,#{user_ids[0]},8.09
      #{round.id},7,1,2,#{user_ids[2]},17.96
      #{round.id},7,1,3,#{user_ids[0]},7.46
      #{round.id},7,1,3,#{user_ids[2]},10.63
      #{round.id},7,1,4,#{user_ids[2]},7
      #{round.id},7,1,4,#{user_ids[0]},18.7
      #{round.id},7,1,5,#{user_ids[2]},14.57
      #{round.id},7,1,5,#{user_ids[0]},19.77
      #{round.id},7,2,1,#{user_ids[0]},13.22
      #{round.id},7,2,1,#{user_ids[2]},13.82
      #{round.id},7,2,2,#{user_ids[2]},8.63
      #{round.id},7,2,2,#{user_ids[0]},17.95
      #{round.id},7,2,3,#{user_ids[2]},7.99
      #{round.id},7,2,3,#{user_ids[0]},14.08
      #{round.id},7,2,4,#{user_ids[2]},11.79
      #{round.id},7,2,4,#{user_ids[0]},16.79
      #{round.id},8,1,1,#{user_ids[5]},9.37
      #{round.id},8,1,1,#{user_ids[3]},12.32
      #{round.id},8,1,2,#{user_ids[5]},6.19
      #{round.id},8,1,2,#{user_ids[3]},18.4
      #{round.id},8,1,3,#{user_ids[3]},15.12
      #{round.id},8,1,3,#{user_ids[5]},16.35
      #{round.id},8,1,4,#{user_ids[5]},15.75
      #{round.id},8,1,4,#{user_ids[3]},16.35
      #{round.id},8,2,1,#{user_ids[3]},9.93
      #{round.id},8,2,1,#{user_ids[5]},17.1
      #{round.id},8,2,2,#{user_ids[3]},9.44
      #{round.id},8,2,2,#{user_ids[5]},19.11
      #{round.id},8,2,3,#{user_ids[5]},6.47
      #{round.id},8,2,3,#{user_ids[3]},12.18
      #{round.id},8,2,4,#{user_ids[3]},7.72
      #{round.id},8,2,4,#{user_ids[5]},12.95
      #{round.id},8,3,1,#{user_ids[5]},9.9
      #{round.id},8,3,1,#{user_ids[3]},12.42
      #{round.id},8,3,2,#{user_ids[3]},11.08
      #{round.id},8,3,2,#{user_ids[5]},15.75
      #{round.id},8,3,3,#{user_ids[5]},9.85
      #{round.id},8,3,3,#{user_ids[3]},11.7
      #{round.id},8,3,4,#{user_ids[5]},7.85
      #{round.id},8,3,4,#{user_ids[3]},14.35
      #{round.id},8,4,1,#{user_ids[5]},5.46
      #{round.id},8,4,1,#{user_ids[3]},15.01
      #{round.id},8,4,2,#{user_ids[3]},7.96
      #{round.id},8,4,2,#{user_ids[5]},11.24
      #{round.id},8,4,3,#{user_ids[5]},8.4
      #{round.id},8,4,3,#{user_ids[3]},18.63
      #{round.id},8,4,4,#{user_ids[5]},12.62
      #{round.id},8,4,4,#{user_ids[3]},18.97
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

  it "creates the correct number of models from the CSV" do
    byebug

    # Ensure clean state
    expect(H2HMatch.count).to eq(0)

    Rake::Task["import:h2h_data"].reenable
    Rake::Task["import:h2h_data"].invoke(temp_csv.path)

    # Assertions based on the snippet of CSV provided
    expect(H2HMatch.count).to eq(2) # Match #1 and Match #5
    expect(H2HSet.count).to eq(2)   # Set #1 in Match 1, Set #2 in Match 5
    expect(H2HAttempt.count).to eq(4) # 4 rows in our 'let' block

    # Check participant logic (Join Table)
    match_5 = H2HMatch.find_by(id: 5)
    expect(match_5.users.pluck(:id)).to contain_exactly(229961, 8184)
  end
end
