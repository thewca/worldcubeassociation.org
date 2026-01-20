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
      round_id,match_number,set_number,set_attempt_number,registration_id,final_position,time_seconds,scramble,is_extra
      #{round.id},1,1,1,#{registration_ids[0]},4,5.48,F2 D2 R' D2 U2 L U2 L F2 D2 B2 D' B' D2 L' D2 F2 D R,0
      #{round.id},1,1,1,#{registration_ids[1]},5,6.74,B' U2 B R2 F2 D2 L2 U2 R2 F R2 D L R2 B' D2 L' D R' F' L',0
      #{round.id},1,1,2,#{registration_ids[1]},5,12.48,D B D2 U2 F R2 F2 L2 F' R2 U2 F' U R' D U L B R D U2,0
      #{round.id},1,1,2,#{registration_ids[0]},4,19.93,B D2 F L2 F' D2 F R2 U2 F2 L2 R D' F' L F2 U' L2 D2 U',0
      #{round.id},1,1,3,#{registration_ids[0]},4,15.43,U' F2 L2 U2 L2 D2 B D2 U2 B2 U2 F2 R F D L2 B F2 U2 R2,0
      #{round.id},1,1,3,#{registration_ids[1]},5,18.80,F U2 B D2 L2 F U2 L2 R2 F R2 B' R B' U2 R' D2 B R2 U F',0
      #{round.id},1,1,4,#{registration_ids[0]},4,6.83,U2 R2 U' B2 D' U2 B2 R2 D F2 R2 B' U' B U2 B' L D U2 F,0
      #{round.id},1,1,4,#{registration_ids[1]},5,18.27,L F' B' D B U L B2 U B2 D2 R U2 B2 R B2 R2 B2 R U2 L,0
      #{round.id},2,1,1,#{registration_ids[4]},8,9.74,L2 U2 B2 F2 R2 D U2 B2 L2 U' F2 B' L2 B' U F' D' R' B F',0
      #{round.id},2,1,1,#{registration_ids[5]},1,14.38,R' U2 R' F2 U' B' U F' L2 F2 D2 L' B2 D2 L' B2 R D2 L U2,0
      #{round.id},2,1,2,#{registration_ids[5]},1,8.25,U F U' F2 R2 D2 F2 R2 D' B2 F2 R2 D' F' L U' B2 L2 B' D' L2,0
      #{round.id},2,1,2,#{registration_ids[4]},8,12.99,F2 U' F' D' B2 U L2 U' L2 D' R2 D' B2 U L R F' L2 U F' U',0
      #{round.id},2,1,3,#{registration_ids[5]},1,10.67,D L2 F2 R2 D2 F2 D' B2 F2 R2 B' L U' F' R2 F2 L2 D L' R',0
      #{round.id},2,1,3,#{registration_ids[4]},8,15.23,R2 D' R U F2 L2 U R2 F2 U F2 L2 B L2 F' U' L B D2,0
      #{round.id},2,1,4,#{registration_ids[5]},1,6.04,D' B2 R2 U' L2 R2 D2 L2 D' B2 F' L' B R D2 R' F2 U' B L,0
      #{round.id},2,1,4,#{registration_ids[4]},8,18.96,D' L U2 F2 D' R2 D' R2 U2 L2 F2 L2 U' B U' R2 F2 D B,0
      #{round.id},3,1,1,#{registration_ids[2]},3,8.23,L' D2 B2 L F2 R2 F2 D2 R' B2 L' F2 D' B' U F2 D' L2 F L2 D',0
      #{round.id},3,1,1,#{registration_ids[7]},7,11.23,U2 F L D2 L B U L2 B L2 F D2 F L2 U2 F D2 L2 R' U,0
      #{round.id},3,1,2,#{registration_ids[7]},7,8.89,B L D' L2 U2 L B2 R' B2 R' B2 U2 F2 U2 B' L B' U R' B L',0
      #{round.id},3,1,2,#{registration_ids[2]},3,9.07,D B2 U' F' R2 U' L' D F U2 R U2 D2 R2 F2 L' B2 R2 F2 U2 R',0
      #{round.id},3,1,3,#{registration_ids[2]},3,14.54,L2 R2 D L2 D' B2 L2 U2 R2 D L U R' F D' L F' R' D2 F,0
      #{round.id},3,1,3,#{registration_ids[7]},7,17.65,U2 B' D' F' R2 L2 D R D2 F2 D2 F2 R2 F' R2 F L2 B' U2 B2 L',0
      #{round.id},3,1,4,#{registration_ids[7]},7,13.98,L' U D' B' U F R F' U2 L2 F R2 B' D2 R2 B' U2 L2 B2 R U2,0
      #{round.id},3,1,4,#{registration_ids[2]},3,19.56,B2 D2 B2 R2 D' L2 B2 F2 D' F2 R' F' L D F2 R' B2 R U' B',0
      #{round.id},3,1,5,#{registration_ids[2]},3,7.05,L2 U2 F D2 B L2 B2 F U2 F' R' D' U2 F' R2 U' L2 R F2,0
      #{round.id},3,1,5,#{registration_ids[7]},7,10.74,B' D2 R2 B' F2 L2 F D2 F' D2 F' R D2 B' U F' L U2 L R,0
      #{round.id},4,1,1,#{registration_ids[3]},2,9.03,B D2 F R2 U2 F' L2 F U2 B2 L2 F' L F2 L' D2 U F R D2,0
      #{round.id},4,1,1,#{registration_ids[6]},6,15.79,D' L' D F B' U2 R U2 F D2 F B2 R2 F' U2 R2 B' U2 L2 R' U2,0
      #{round.id},4,1,2,#{registration_ids[3]},2,8.95,F2 U R' F2 R2 B2 U' L2 B R F2 L2 D2 L F2 B2 D2 L U2 R',0
      #{round.id},4,1,2,#{registration_ids[6]},6,17.11,U2 B' D L' B2 U2 F D F' L2 B U2 F2 B U2 R2 U2 D2 B2 R2,0
      #{round.id},4,1,3,#{registration_ids[3]},2,6.28,U2 F L B2 R2 D2 R' U2 L' F2 D2 B2 D' L' D' B2 U2 L2 F,0
      #{round.id},4,1,3,#{registration_ids[6]},6,7.53,B2 U2 L' U2 R B2 R U2 R' B' L' R' D2 U' B' R D' U',0
      #{round.id},5,1,1,#{registration_ids[0]},4,17.08,R' U2 L' U' D' B' U' F' B' D2 F' D2 R2 B' L2 D2 F U' B2,0
      #{round.id},5,1,1,#{registration_ids[5]},1,18.36,U2 B' U2 R2 F' D2 U2 R2 B2 D2 F' U2 L D' R' F2 R B2 F' L2 D,0
      #{round.id},5,1,2,#{registration_ids[0]},4,6.2,B D R2 F2 U2 B2 D2 R' D2 L D2 F2 L' F2 B R D R' U' R F,0
      #{round.id},5,1,2,#{registration_ids[5]},1,7.29,D F2 U2 R2 B2 F2 D2 L2 U B2 D2 B' U F D R B R2 D L U,0
      #{round.id},5,1,3,#{registration_ids[5]},1,15.01,R B2 D' F2 D L2 B2 U2 L2 F2 U' F2 D L R F L2 R' B D2,0
      #{round.id},5,1,3,#{registration_ids[0]},4,19.89,F2 U' R' B' L2 D2 B D2 U2 B R2 B' U2 F' U F L2 D L F' R,0
      #{round.id},5,1,4,#{registration_ids[0]},4,13.6,D2 F2 D' R2 B' U2 B2 L2 U2 R2 B D2 R2 D' B' L2 R' B U2 L',0
      #{round.id},5,1,4,#{registration_ids[5]},1,16.94,F' B D F U2 D L' D' R2 D2 B U2 F' L2 F' L2 D2 B2 R2 F D,0
      #{round.id},5,2,1,#{registration_ids[0]},4,8.86,U2 B R2 D' R2 B2 U R2 D F2 D' B2 F2 L2 R' B L U' L' F' R2,0
      #{round.id},5,2,1,#{registration_ids[5]},1,14.23,U D2 R D R2 F D' R U' R L2 U2 R2 U2 F2 D2 F2 L' D2 B2,0
      #{round.id},5,2,2,#{registration_ids[5]},1,6.83,B2 D L2 F2 U B2 U' L2 U' R2 D L' F R' D B' L' R2 U2 B R',0
      #{round.id},5,2,2,#{registration_ids[0]},4,7.05,U2 L2 D' R D2 F2 D B' R B2 R2 D B2 D R2 D R2 F2 U L2 U',0
      #{round.id},5,2,3,#{registration_ids[5]},1,5.15,F' R U' R2 U F2 D' F2 L2 U F2 U2 L D B D L2 F2 U2,0
      #{round.id},5,2,3,#{registration_ids[0]},4,14.08,D2 F2 U L2 B2 U L2 B2 D' R2 L' U L' U B' L B2 F R D',0
      #{round.id},5,2,4,#{registration_ids[5]},1,8.41,U' L' D2 U F2 R2 D2 U2 B L2 R' B2 D B D2 L2 U,0
      #{round.id},5,2,4,#{registration_ids[0]},4,15.93,U2 F2 R2 F2 R2 U' B2 F2 L2 R D2 L' U2 R B D' B' R,0
      #{round.id},5,3,1,#{registration_ids[5]},1,9.71,U' L' D2 F2 D' R2 F2 D L2 F2 D2 L' F D B' U L2 U',0
      #{round.id},5,3,1,#{registration_ids[0]},4,13.16,F D' B' L' B R' D2 B' D U2 F R2 F L2 B' U2 F' L2 F,0
      #{round.id},5,3,2,#{registration_ids[5]},1,8.47,R' B' D' L2 B2 L2 D2 B2 U' F2 L2 U2 F2 B' L F D L2 D L,0
      #{round.id},5,3,2,#{registration_ids[0]},4,17.42,D' F' D L2 F2 D' R2 F2 D B2 D B2 L F2 D R' B F2 D L2,0
      #{round.id},5,3,3,#{registration_ids[5]},1,8.44,L' D' R2 U F' B L' U R2 U2 R' F2 U2 F2 L' U2 D2 F2 R' F2 D',0
      #{round.id},5,3,3,#{registration_ids[0]},4,14.26,U2 F2 D F' R' D L F2 U2 B2 U D F2 R2 F2 R2 B2 L',0
      #{round.id},6,1,1,#{registration_ids[3]},2,9.97,F R F L' D' B' R D2 F' U' B2 D' F2 D R2 D' F2 U L2 D R2,0
      #{round.id},6,1,1,#{registration_ids[2]},3,10.68,D2 L B D R2 F' L U F' B2 R B2 R2 B2 D2 R2 D2 R' F2 L' U2,0
      #{round.id},6,1,2,#{registration_ids[3]},2,15.24,R B2 D2 B2 F2 R D2 U2 L R F2 D' F R U R F D B L2 U2,0
      #{round.id},6,1,2,#{registration_ids[2]},3,19.17,U' F' R2 B2 U' F2 U' F2 D2 R2 F2 D' L2 R' F2 L2 R' B L2 D,0
      #{round.id},6,1,3,#{registration_ids[2]},3,7.5,U' F2 L F2 L' D2 R2 F2 R' B2 L D2 R2 B' R' F L' U' B' U',0
      #{round.id},6,1,3,#{registration_ids[3]},2,11.82,B' U2 L2 R2 B2 R2 D B2 D F2 L2 B R' B2 D' U' R' B2 F2,0
      #{round.id},6,1,4,#{registration_ids[2]},3,15.81,L2 D' B2 L2 R2 D' L2 R2 B2 U R2 D L U' R D L B' D2 R' U',0
      #{round.id},6,1,4,#{registration_ids[3]},2,18.53,F2 R' D R' D' B' L' B2 U F D2 F L2 F2 D2 B R2 B2 D2 B',0
      #{round.id},6,1,5,#{registration_ids[3]},2,9.94,F2 D' F' D' B R F' U D' B2 R F2 R2 F2 B2 D2 R B2 R D2,0
      #{round.id},6,1,5,#{registration_ids[2]},3,12.36,R' B2 L2 B' U2 F2 L2 U2 B2 R2 D2 B D U' L U F D2 L B',0
      #{round.id},6,2,1,#{registration_ids[3]},2,7.48,F2 U L2 U' L2 U' B2 F2 R2 D' U R' F' L' D F D F' R' D',0
      #{round.id},6,2,1,#{registration_ids[2]},3,16.5,L2 B R2 B2 L2 F' R2 F D2 B2 U' L B2 D F' R B' R' U' B,0
      #{round.id},6,2,2,#{registration_ids[3]},2,14.95,F U' D R L2 F B' L D R B2 L F2 D2 L' D2 L2 U2,0
      #{round.id},6,2,2,#{registration_ids[2]},3,18.18,D2 B F R2 B' L2 D2 B L2 F' L2 F2 L' R F' L' U' B R F U',0
      #{round.id},6,2,3,#{registration_ids[3]},2,5.12,B2 D' R2 B2 D2 B R2 B L2 B L2 U2 L2 U2 L' B' D2 U B U B2,0
      #{round.id},6,2,3,#{registration_ids[2]},3,8.75,L B D' R2 D2 B2 R2 D' L2 D2 R2 F2 L2 B' R B' L' R F2 U,0
      #{round.id},7,1,1,#{registration_ids[2]},3,6.8,L' B' R L2 U' B' R F L F2 R2 B2 D2 L2 B' U2 F U2 B2 R2 B,0
      #{round.id},7,1,1,#{registration_ids[0]},4,10.26,L2 F2 L2 F' B2 U' B L' D U2 R' D2 L' F2 R2 U2 L U2,0
      #{round.id},7,1,2,#{registration_ids[0]},4,8.09,B' D2 B2 F U2 F U2 R2 F2 U2 R2 L B2 U' F U2 R' F2 R' F2,0
      #{round.id},7,1,2,#{registration_ids[2]},3,17.96,B D' L F2 U2 L2 F2 R' D2 L D2 F2 L' F' D L' D2 L' B2 R,0
      #{round.id},7,1,3,#{registration_ids[0]},4,7.46,L2 U' B2 R2 D2 B2 D L2 U2 F2 B L' R D F R D R' B,0
      #{round.id},7,1,3,#{registration_ids[2]},3,10.63,L' B' U' F2 U B2 D B2 L2 D2 F2 U' F2 R U' B L2 U2 L2 F2 L2,0
      #{round.id},7,1,4,#{registration_ids[2]},3,7,U2 L B2 F2 L' B2 L' D2 R2 F2 D U' B L B D' R' F',0
      #{round.id},7,1,4,#{registration_ids[0]},4,18.7,R2 U2 B2 U2 L U2 L D2 R' B2 R F2 D' L B D' F L' U2 B' R',0
      #{round.id},7,1,5,#{registration_ids[2]},3,14.57,B2 D R2 D2 R2 U' L2 B2 F2 U2 B2 U' L' U2 B R U2 L R B U2,0
      #{round.id},7,1,5,#{registration_ids[0]},4,19.77,F' L2 U F2 L2 U R2 U R2 D2 R2 F2 U2 R D2 R2 F' D2 R' B' L2,0
      #{round.id},7,2,1,#{registration_ids[0]},4,13.22,R' L2 U2 L2 R2 B' L2 B2 F U2 F' L2 U' R B F R B' R2 U,0
      #{round.id},7,2,1,#{registration_ids[2]},3,13.82,D' L2 F' U2 R U2 L' B U L' B2 L F2 U2 L D2 F2 U2 R2,0
      #{round.id},7,2,2,#{registration_ids[2]},3,8.63,L' U D' R D2 R2 F U B' L2 B' R2 D2 L2 D2 R2 B U2 D2 F2,0
      #{round.id},7,2,2,#{registration_ids[0]},4,17.95,L2 U' L2 R2 U' L2 U2 L2 U' R2 F2 U' R D L F' R' F2 D' R U2,0
      #{round.id},7,2,3,#{registration_ids[2]},3,7.99,R F' D' B2 R' D2 R' U2 R B2 D2 F2 R D2 F' U2 B' R' F' D' R',0
      #{round.id},7,2,3,#{registration_ids[0]},4,14.08,U2 R2 U B2 L2 U' L2 B2 U' L2 B' D F2 L2 B' L2 U' L R2,0
      #{round.id},7,2,4,#{registration_ids[2]},3,11.79,B' D B' R' D R2 L' D F R D2 B2 D2 R' F2 R F2 D2,0
      #{round.id},7,2,4,#{registration_ids[0]},4,16.79,L' D F2 D U2 L2 B2 D R2 B2 U L2 B' D' B R B' U L F' D,0
      #{round.id},8,1,1,#{registration_ids[5]},1,9.37,U R2 U2 R' F2 L' F2 D2 R2 D2 U B D U' L' B2 F L2 R',0
      #{round.id},8,1,1,#{registration_ids[3]},2,12.32,U D' B U2 F R U' L' D L2 D2 R2 B2 D2 F2 U2 L F2 U2 L2 F2,0
      #{round.id},8,1,2,#{registration_ids[5]},1,6.19,D B' D' F2 U' B2 L2 U' L2 D' R2 D B2 R2 B' L U2 R U L' F2,0
      #{round.id},8,1,2,#{registration_ids[3]},2,18.4,U L2 U B2 L2 R2 U F2 U' B2 R2 B' R' F' D' L D' B2 D U2 F',0
      #{round.id},8,1,3,#{registration_ids[3]},2,15.12,D2 B2 F2 D R2 D' R2 B2 U2 L2 U R2 B' L U2 R' F' D L B' U2,0
      #{round.id},8,1,3,#{registration_ids[5]},1,16.35,U F' D' L2 B2 U2 L2 B2 U B2 U L2 U' R D2 L U B L' R' F,0
      #{round.id},8,1,4,#{registration_ids[5]},1,15.75,L' D B' R U F2 D' B2 U R L' D2 L U2 R U2 R' B2 U2 D2 L2,0
      #{round.id},8,1,4,#{registration_ids[3]},2,16.35,U2 R' D' L2 D L2 F2 U' L2 F2 D2 B2 F2 L U F' D' B' U B2 L',0
      #{round.id},8,2,1,#{registration_ids[3]},2,9.93,D F R F' R' F2 L B2 R2 U' L2 B2 U B2 R2 B2 U2 L F,0
      #{round.id},8,2,1,#{registration_ids[5]},1,17.1,R L F' B2 U' B L U R' B2 R F2 B2 U2 R D2 R2 U2 F2 B,0
      #{round.id},8,2,2,#{registration_ids[3]},2,9.44,F2 U2 B L2 R2 F R2 F R2 F' R F' D' U' B' L F2 D F2 R2,0
      #{round.id},8,2,2,#{registration_ids[5]},1,19.11,R' U' B2 L2 F2 D2 U' B2 U L2 U' L2 R B2 R2 B D2 L' U' B,0
      #{round.id},8,2,3,#{registration_ids[5]},1,6.47,R2 D2 U2 R B2 D2 L R U2 B D U' B U2 F L' R' D U2,0
      #{round.id},8,2,3,#{registration_ids[3]},2,12.18,L B2 U' F2 L2 U2 L2 D R2 U R2 B2 U' L' D2 B' F' R B' U F2,0
      #{round.id},8,2,4,#{registration_ids[3]},2,7.72,D R2 U2 R2 U2 R2 B' F' D2 F R2 F2 D' F' R B' R U2 F2 D',0
      #{round.id},8,2,4,#{registration_ids[5]},1,12.95,U2 L U2 L B2 R' B2 R D2 U2 R D2 B' L R' F2 D' L' U F' R2,0
      #{round.id},8,3,1,#{registration_ids[5]},1,9.9,B L2 B2 U2 L' U2 L F2 U2 R B2 R' B2 D F R U L' D' F2 U2,0
      #{round.id},8,3,1,#{registration_ids[3]},2,12.42,U2 B2 D' L2 R2 F2 U2 L2 U' R2 D L2 B' R D L' B R2 B2 F L,0
      #{round.id},8,3,2,#{registration_ids[3]},2,11.08,U2 F2 U2 B2 R2 F2 U' F2 D2 B' R D2 F D' F2 U2 R D F',0
      #{round.id},8,3,2,#{registration_ids[5]},1,15.75,R U R2 F' U R D R D2 F2 R' U2 D2 F2 R F2 L U2 F L F2,0
      #{round.id},8,3,3,#{registration_ids[5]},1,9.85,D R F L' U F2 R' B L F U2 B2 U B2 R2 U L2 U B2 R2,0
      #{round.id},8,3,3,#{registration_ids[3]},2,11.7,F' L' D' L2 U R2 U F2 R2 U2 L2 F2 U B L' B F R' B U R2,0
      #{round.id},8,3,4,#{registration_ids[5]},1,7.85,R' F2 D R2 F2 D U2 F2 U F2 U' B2 R' F2 U2 B R2 F2 D2 L' R',0
      #{round.id},8,3,4,#{registration_ids[3]},2,14.35,D2 L2 B U2 R2 B2 F D2 L2 F2 L2 U' L' D' B2 L2 R B' U2 R2,0
      #{round.id},8,4,1,#{registration_ids[5]},1,5.46,F' U2 R2 F' D2 F2 L2 B R2 U2 L2 U B D B R B' F2 U' R D2,0
      #{round.id},8,4,1,#{registration_ids[3]},2,15.01,R2 D R2 F2 D2 B2 D2 F' R2 U2 F2 R' B2 U' B' D2 F' R,0
      #{round.id},8,4,2,#{registration_ids[3]},2,7.96,L' F B' D' F' D2 L F2 U B2 U' L2 D R2 U2 F2 L2 F2 R' D,0
      #{round.id},8,4,2,#{registration_ids[5]},1,11.24,B' R' U' F' L F D' F' D' F R2 D2 F2 D2 B R2 U2 F L2 F2,0
      #{round.id},8,4,3,#{registration_ids[5]},1,8.4,U2 R L U' D2 R' B D F2 B' R2 B' L2 D2 B R2 L2 F' D2 R',0
      #{round.id},8,4,3,#{registration_ids[3]},2,18.63,D' F2 L2 B2 F2 R2 D R2 U' B2 D2 R F' D B2 U R' D' U2 B2,0
      #{round.id},8,4,4,#{registration_ids[5]},1,12.62,U L D' F2 B U' F L2 F2 L2 D2 L D2 L' U2 D2 L U2 F' U2,0
      #{round.id},8,4,4,#{registration_ids[3]},2,18.97,U2 B2 D' B2 L U2 L' F' U L2 U B2 D' F2 D R2 U2 D L2 B,0
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

    it 'creates the expected number of model objects' do
      expect(LiveResult.count).to be(8)
      expect(Result.count).to be(0)
      expect(H2hMatch.count).to be(8)
      expect(H2hMatchCompetitor.count).to be(16)
      expect(H2hSet.count).to be(15)
      expect(LiveAttempt.count).to be(120)
      expect(ResultAttempt.count).to be(0)
      expect(H2hAttempt.count).to be(120)
      expect(H2hAttempt.where(live_attempt_id: nil).count).to be(0)
      expect(H2hAttempt.where(result_attempt_id: nil).count).to be(120)
    end

    it 'creates valid LiveResults' do
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
    before do
      Rake::Task["h2h_results:import"].reenable
      Rake::Task["h2h_results:import"].invoke(temp_csv.path)
      Rake::Task["h2h_results:post"].reenable
      Rake::Task["h2h_results:post"].invoke(competition.id)
    end

    it 'creates/deletes the expected number of model objects', :cxz do
      expect(LiveResult.count).to be(0)
      expect(Result.count).to be(8)
      expect(H2hMatch.count).to be(8)
      expect(H2hMatchCompetitor.count).to be(16)
      expect(H2hSet.count).to be(15)
      expect(LiveAttempt.count).to be(0)
      expect(ResultAttempt.count).to be(120)
      expect(H2hAttempt.count).to be(120)
      expect(H2hAttempt.where(live_attempt_id: nil).count).to be(120)
      expect(H2hAttempt.where(result_attempt_id: nil).count).to be(0)
    end
  end
end
