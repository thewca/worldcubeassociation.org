# frozen_string_literal: true

require 'rails_helper'
require 'rake'

RSpec.describe "import:h2h_data", type: :task do
  before(:all) do
    Rake.application.rake_require "tasks/h2h_results_import"
    Rake::Task.define_task(:environment)
  end

  let!(:competition) { create(:competition, :with_valid_schedule, h2h_finals_event_ids: ['333']) }
  let!(:registrations) { create_list(:registration, 12, competition: competition) }
  let!(:round) { competition.competition_events.where(event_id: "333").first.rounds.first }
  let!(:registration_ids) { Registration.pluck(:id) }

  let(:csv_content) do
    <<~CSV
      round_id,match_number,match_set_number,set_attempt_number,registration_id,final_position,time_seconds,scramble,scramble_set_number,scramble_number,is_extra
      #{round.id},1,1,1,#{registration_ids[0]},10,6.69,L2 R2 B2 L2 D' B2 D' B2 U F U' R F' U' F2 U' B D2 F,1,1,0
      #{round.id},1,1,2,#{registration_ids[0]},10,10.15,B' L2 B2 D B2 D R2 U R2 D2 B2 L2 D2 R' D L2 U R' D2 F',1,2,0
      #{round.id},1,1,3,#{registration_ids[0]},10,8.67,D' B' L' F2 L2 U2 B' F' D2 F L2 F' L D2 R' F' L D U,1,3,0
      #{round.id},1,1,4,#{registration_ids[0]},10,8.40,D R2 L' U D L2 U R2 B' R2 F' L2 F U2 R2 B2 U2 D' L,1,4,0
      #{round.id},1,1,1,#{registration_ids[1]},5,7.49,L2 R2 B2 L2 D' B2 D' B2 U F U' R F' U' F2 U' B D2 F,1,1,0
      #{round.id},1,1,2,#{registration_ids[1]},5,8.73,B' L2 B2 D B2 D R2 U R2 D2 B2 L2 D2 R' D L2 U R' D2 F',1,2,0
      #{round.id},1,1,3,#{registration_ids[1]},5,7.56,D' B' L' F2 L2 U2 B' F' D2 F L2 F' L D2 R' F' L D U,1,3,0
      #{round.id},1,1,4,#{registration_ids[1]},5,7.02,D R2 L' U D L2 U R2 B' R2 F' L2 F U2 R2 B2 U2 D' L,1,4,0
      #{round.id},2,1,1,#{registration_ids[2]},6,7.74,F B2 D' B D2 R' D2 R D' F2 U2 L2 F' R2 B' U2 L2 B2 L2 F',2,1,0
      #{round.id},2,1,2,#{registration_ids[2]},6,10.20,R U' F2 L' U R F D2 L F2 U2 R2 U2 B2 L U2 R' U' B,2,2,0
      #{round.id},2,1,3,#{registration_ids[2]},6,8.98,D2 F' L2 B R2 B' L2 F' L' D' U' F2 R' D2 U2 B D2 U' L,2,3,0
      #{round.id},2,1,4,#{registration_ids[2]},6,7.34,F' R2 B R' B' U L B' R2 F U2 F' U2 L2 F L2 B2 D2 U' L2,2,4,0
      #{round.id},2,1,5,#{registration_ids[2]},6,6.80,R2 F' U' R F R2 B2 D2 U2 L2 U2 B2 L R2 D' F R U' L,2,5,0
      #{round.id},2,1,1,#{registration_ids[3]},11,7.00,F B2 D' B D2 R' D2 R D' F2 U2 L2 F' R2 B' U2 L2 B2 L2 F',2,1,0
      #{round.id},2,1,2,#{registration_ids[3]},11,6.86,R U' F2 L' U R F D2 L F2 U2 R2 U2 B2 L U2 R' U' B,2,2,0
      #{round.id},2,1,3,#{registration_ids[3]},11,9.67,D2 F' L2 B R2 B' L2 F' L' D' U' F2 R' D2 U2 B D2 U' L,2,3,0
      #{round.id},2,1,4,#{registration_ids[3]},11,7.94,F' R2 B R' B' U L B' R2 F U2 F' U2 L2 F L2 B2 D2 U' L2,2,4,0
      #{round.id},2,1,5,#{registration_ids[3]},11,7.65,R2 F' U' R F R2 B2 D2 U2 L2 U2 B2 L R2 D' F R U' L,2,5,0
      #{round.id},3,1,1,#{registration_ids[4]},7,9.53,U2 R' B2 D L2 R2 D' L2 F2 D' U' B' D2 R' F2 D B U,3,1,0
      #{round.id},3,1,2,#{registration_ids[4]},7,6.27,F2 L B U L' B D' F2 R U B2 U D' B2 U' L2 B2 L2 D,3,2,0
      #{round.id},3,1,3,#{registration_ids[4]},7,6.41,L U B L D2 L' F2 R D2 R2 B2 D' L B U2 R2 D' B' F',3,3,0
      #{round.id},3,1,4,#{registration_ids[4]},7,6.45,B2 L' R2 F2 D' B2 D2 U2 L2 F2 U2 F' U' R2 U' L' R' F2 R2,3,4,0
      #{round.id},3,1,1,#{registration_ids[5]},12,7.67,U2 R' B2 D L2 R2 D' L2 F2 D' U' B' D2 R' F2 D B U,3,1,0
      #{round.id},3,1,2,#{registration_ids[5]},12,8.03,F2 L B U L' B D' F2 R U B2 U D' B2 U' L2 B2 L2 D,3,2,0
      #{round.id},3,1,3,#{registration_ids[5]},12,9.54,L U B L D2 L' F2 R D2 R2 B2 D' L B U2 R2 D' B' F',3,3,0
      #{round.id},3,1,4,#{registration_ids[5]},12,-1,B2 L' R2 F2 D' B2 D2 U2 L2 F2 U2 F' U' R2 U' L' R' F2 R2,3,4,0
      #{round.id},4,1,1,#{registration_ids[6]},8,7.55,U' B' R' L' U F2 D R' L2 F D2 B2 L2 U2 R2 D2 F2 U' L2,4,1,0
      #{round.id},4,1,2,#{registration_ids[6]},8,7.98,R2 F' R F2 L2 F' U2 F' D2 U2 B2 F' D L U F U' F2 U,4,2,0
      #{round.id},4,1,3,#{registration_ids[6]},8,6.52,L' U2 L2 B L' B U' F2 U2 F' R F2 R B2 R' F2 B2 D2 F2,4,3,0
      #{round.id},4,1,4,#{registration_ids[6]},8,6.81,U2 D L2 B D2 L2 D' R' U2 R2 U2 B2 L' U2 L2 D2 R B U',4,4,0
      #{round.id},4,1,1,#{registration_ids[7]},9,6.34,U' B' R' L' U F2 D R' L2 F D2 B2 L2 U2 R2 D2 F2 U' L2,4,1,0
      #{round.id},4,1,2,#{registration_ids[7]},9,8.40,R2 F' R F2 L2 F' U2 F' D2 U2 B2 F' D L U F U' F2 U,4,2,0
      #{round.id},4,1,3,#{registration_ids[7]},9,8.14,L' U2 L2 B L' B U' F2 U2 F' R F2 R B2 R' F2 B2 D2 F2,4,3,0
      #{round.id},4,1,4,#{registration_ids[7]},9,7.28,U2 D L2 B D2 L2 D' R' U2 R2 U2 B2 L' U2 L2 D2 R B U',4,4,0
      #{round.id},5,1,1,#{registration_ids[8]},1,5.27,B2 F2 L2 U2 R2 U F2 D B' U2 F L2 R B' R' F2 L R2 D2,5,1,0
      #{round.id},5,1,2,#{registration_ids[8]},1,4.59,R F' U2 F' U2 F2 D2 U2 F' D2 L U' L2 D' L F' U2 F2 R U2,5,2,0
      #{round.id},5,1,3,#{registration_ids[8]},1,5.02,F D' R' F' U' B2 U2 B' R L' F U2 R2 F2 R L2 B2 L2 D2,5,3,0
      #{round.id},5,1,1,#{registration_ids[1]},5,6.88,B2 F2 L2 U2 R2 U F2 D B' U2 F L2 R B' R' F2 L R2 D2,5,1,0
      #{round.id},5,1,2,#{registration_ids[1]},5,6.05,R F' U2 F' U2 F2 D2 U2 F' D2 L U' L2 D' L F' U2 F2 R U2,5,2,0
      #{round.id},5,1,3,#{registration_ids[1]},5,6.00,F D' R' F' U' B2 U2 B' R L' F U2 R2 F2 R L2 B2 L2 D2,5,3,0
      #{round.id},6,1,1,#{registration_ids[2]},6,6.06,R' B U' R' B2 L B2 L D2 F2 D2 R' F' D L' U2 L B L D,6,1,0
      #{round.id},6,1,2,#{registration_ids[2]},6,6.91,L' B2 D R' U R2 D F' L B D2 F2 U F2 R2 U2 R2 B2 R2 F2,6,2,0
      #{round.id},6,1,3,#{registration_ids[2]},6,6.24,L2 B2 U' L' U' F D R' L2 U2 B2 R B2 L F2 D2 F' L2 F',6,3,0
      #{round.id},6,1,4,#{registration_ids[2]},6,8.00,U' D F' L U' D L' B2 U2 R U2 F' B' L2 F' B2 U2 L2,6,4,0
      #{round.id},6,1,5,#{registration_ids[2]},6,6.71,F2 L' B' R' U2 L R2 D2 L F' D U L2 F' L B' R2,6,5,0
      #{round.id},6,1,1,#{registration_ids[9]},4,6.29,R' B U' R' B2 L B2 L D2 F2 D2 R' F' D L' U2 L B L D,6,1,0
      #{round.id},6,1,2,#{registration_ids[9]},4,5.58,L' B2 D R' U R2 D F' L B D2 F2 U F2 R2 U2 R2 B2 R2 F2,6,2,0
      #{round.id},6,1,3,#{registration_ids[9]},4,6.71,L2 B2 U' L' U' F D R' L2 U2 B2 R B2 L F2 D2 F' L2 F',6,3,0
      #{round.id},6,1,4,#{registration_ids[9]},4,7.43,U' D F' L U' D L' B2 U2 R U2 F' B' L2 F' B2 U2 L2,6,4,0
      #{round.id},6,1,5,#{registration_ids[9]},4,5.34,F2 L' B' R' U2 L R2 D2 L F' D U L2 F' L B' R2,6,5,0
      #{round.id},7,1,1,#{registration_ids[10]},3,6.97,D B2 D B2 L2 U B2 D2 L2 F2 B' L B2 U2 B' F2 U L' R' U,7,1,0
      #{round.id},7,1,2,#{registration_ids[10]},3,8.90,F2 R B' R2 U2 B U R U2 D2 R' L U2 L U2 F2 U2 L' D L',7,2,0
      #{round.id},7,1,3,#{registration_ids[10]},3,5.30,D F2 U R F2 U' R B D R2 U B2 R2 U2 R2 D2 R B2,7,3,0
      #{round.id},7,1,4,#{registration_ids[10]},3,5.41,U2 F' L' D2 F2 R2 U' L2 F B2 R2 B2 D L2 U R2 B2 F',7,4,0
      #{round.id},7,1,5,#{registration_ids[10]},3,6.13,L' D' R' U2 L2 B' R2 F2 R2 B' U2 B F2 L B D B' D B F2,7,5,0
      #{round.id},7,1,1,#{registration_ids[4]},7,6.67,D B2 D B2 L2 U B2 D2 L2 F2 B' L B2 U2 B' F2 U L' R' U,7,1,0
      #{round.id},7,1,2,#{registration_ids[4]},7,7.38,F2 R B' R2 U2 B U R U2 D2 R' L U2 L U2 F2 U2 L' D L',7,2,0
      #{round.id},7,1,3,#{registration_ids[4]},7,8.23,D F2 U R F2 U' R B D R2 U B2 R2 U2 R2 D2 R B2,7,3,0
      #{round.id},7,1,4,#{registration_ids[4]},7,10.33,U2 F' L' D2 F2 R2 U' L2 F B2 R2 B2 D L2 U R2 B2 F',7,4,0
      #{round.id},7,1,5,#{registration_ids[4]},7,7.06,L' D' R' U2 L2 B' R2 F2 R2 B' U2 B F2 L B D B' D B F2,7,5,0
      #{round.id},8,1,1,#{registration_ids[6]},8,7.74,L' U B2 R2 L' B' D2 F2 D F' R2 U' L2 D' R2 F2 U F,8,1,0
      #{round.id},8,1,2,#{registration_ids[6]},8,7.73,L' U' D B' R2 L F U' B2 U2 R2 L2 B D2 F' L2 D2 B' L',8,2,0
      #{round.id},8,1,3,#{registration_ids[6]},8,6.92,U F' L' B2 F2 D' R2 D B2 R2 D L2 U B' L' F L2 D' U F,8,3,0
      #{round.id},8,1,1,#{registration_ids[11]},2,6.55,L' U B2 R2 L' B' D2 F2 D F' R2 U' L2 D' R2 F2 U F,8,1,0
      #{round.id},8,1,2,#{registration_ids[11]},2,4.92,L' U' D B' R2 L F U' B2 U2 R2 L2 B D2 F' L2 D2 B' L',8,2,0
      #{round.id},8,1,3,#{registration_ids[11]},2,5.09,U F' L' B2 F2 D' R2 D B2 R2 D L2 U B' L' F L2 D' U F,8,3,0
      #{round.id},9,1,1,#{registration_ids[8]},1,3.83,R2 U' B2 R' B D B U' B' L2 B U2 L2 F2 L2 F' L D' F,9,1,0
      #{round.id},9,1,2,#{registration_ids[8]},1,4.84,U D R' B D' B U' L2 B' R' F2 L2 D2 R2 F' R2 B2 D2,9,2,0
      #{round.id},9,1,3,#{registration_ids[8]},1,4.97,R' B L2 U R B' D R' D2 R2 B U D' L2 U' L2 B2 U' F2,9,3,0
      #{round.id},9,1,1,#{registration_ids[9]},4,7.76,R2 U' B2 R' B D B U' B' L2 B U2 L2 F2 L2 F' L D' F,9,1,0
      #{round.id},9,1,2,#{registration_ids[9]},4,7.37,U D R' B D' B U' L2 B' R' F2 L2 D2 R2 F' R2 B2 D2,9,2,0
      #{round.id},9,1,3,#{registration_ids[9]},4,5.37,R' B L2 U R B' D R' D2 R2 B U D' L2 U' L2 B2 U' F2,9,3,0
      #{round.id},9,2,1,#{registration_ids[8]},1,5.12,D2 R2 F' L2 B' R2 F' U' R B F' U' L' F' L' U' F' R',10,1,0
      #{round.id},9,2,2,#{registration_ids[8]},1,5.68,F2 R2 F R2 B D2 L2 U' L' B L' D R2 F U2 R U' L,10,2,0
      #{round.id},9,2,3,#{registration_ids[8]},1,4.47,F2 B' R2 L' F U F U R2 F R2 L2 U D R2 D' L2 U2 B2,10,3,0
      #{round.id},9,2,1,#{registration_ids[9]},4,7.37,D2 R2 F' L2 B' R2 F' U' R B F' U' L' F' L' U' F' R',10,1,0
      #{round.id},9,2,2,#{registration_ids[9]},4,6.07,F2 R2 F R2 B D2 L2 U' L' B L' D R2 F U2 R U' L,10,2,0
      #{round.id},9,2,3,#{registration_ids[9]},4,5.75,F2 B' R2 L' F U F U R2 F R2 L2 U D R2 D' L2 U2 B2,10,3,0
      #{round.id},10,1,1,#{registration_ids[10]},3,6.30,D R2 U' F2 D' R2 B2 R2 B2 U2 B2 L D2 B U' R2 F' U2,11,1,0
      #{round.id},10,1,2,#{registration_ids[10]},3,5.82,D' L2 D' R2 D' U' L2 U R2 L' U B F2 D2 U L D U L F,11,2,0
      #{round.id},10,1,3,#{registration_ids[10]},3,6.59,R B L B' R' U' F' R2 U' R2 F' R2 F2 L2 F R2 F R2,11,3,0
      #{round.id},10,1,4,#{registration_ids[10]},3,6.79,B U R2 D B2 U' R2 D2 B2 F2 R2 U B' R' F2 U L R' B' R',11,4,0
      #{round.id},10,1,5,#{registration_ids[10]},3,5.58,D B L U F' B U D2 R2 F2 R2 F2 B D2 F2 U' L U2,11,5,0
      #{round.id},10,1,1,#{registration_ids[11]},2,8.15,D R2 U' F2 D' R2 B2 R2 B2 U2 B2 L D2 B U' R2 F' U2,11,1,0
      #{round.id},10,1,2,#{registration_ids[11]},2,6.22,D' L2 D' R2 D' U' L2 U R2 L' U B F2 D2 U L D U L F,11,2,0
      #{round.id},10,1,3,#{registration_ids[11]},2,5.47,R B L B' R' U' F' R2 U' R2 F' R2 F2 L2 F R2 F R2,11,3,0
      #{round.id},10,1,4,#{registration_ids[11]},2,6.17,B U R2 D B2 U' R2 D2 B2 F2 R2 U B' R' F2 U L R' B' R',11,4,0
      #{round.id},10,1,5,#{registration_ids[11]},2,5.14,D B L U F' B U D2 R2 F2 R2 F2 B D2 F2 U' L U2,11,5,0
      #{round.id},10,2,1,#{registration_ids[10]},3,6.63,D2 F2 D' F' L2 U' L U' R2 U' B2 D' B2 U L2 R' U' F L,12,1,0
      #{round.id},10,2,2,#{registration_ids[10]},3,6.14,R U2 B F2 L2 B2 F2 L' U2 B2 R2 F2 R D B' D2 F' D2 L U,12,2,0
      #{round.id},10,2,3,#{registration_ids[10]},3,5.68,D2 U2 B2 D2 R2 U2 L D2 U2 L2 B' L2 U' R' D' B2 U' B' D2 F',12,3,0
      #{round.id},10,2,4,#{registration_ids[10]},3,5.99,D R' B2 F2 D2 R' U2 R F2 R B U2 L2 U' L D2 L D2 F,12,4,0
      #{round.id},10,2,1,#{registration_ids[11]},2,5.73,D2 F2 D' F' L2 U' L U' R2 U' B2 D' B2 U L2 R' U' F L,12,1,0
      #{round.id},10,2,2,#{registration_ids[11]},2,7.27,R U2 B F2 L2 B2 F2 L' U2 B2 R2 F2 R D B' D2 F' D2 L U,12,2,0
      #{round.id},10,2,3,#{registration_ids[11]},2,4.93,D2 U2 B2 D2 R2 U2 L D2 U2 L2 B' L2 U' R' D' B2 U' B' D2 F',12,3,0
      #{round.id},10,2,4,#{registration_ids[11]},2,5.85,D R' B2 F2 D2 R' U2 R F2 R B U2 L2 U' L D2 L D2 F,12,4,0
      #{round.id},11,1,1,#{registration_ids[9]},4,9.01,U' R2 U L2 D F2 L2 D2 R' B2 D L2 R2 B R2 B2 U2 F L',13,1,0
      #{round.id},11,1,2,#{registration_ids[9]},4,5.29,D' B2 R' B2 L2 D2 F R F R2 D F2 U L2 U R2 B2 D2 R2,13,2,0
      #{round.id},11,1,3,#{registration_ids[9]},4,6.43,F U R2 B2 U F2 D2 U' L D2 U2 L' D' R2 D' B2 F D2,13,3,0
      #{round.id},11,1,4,#{registration_ids[9]},4,6.54,U D2 B2 D2 U2 L' D2 L' R2 F2 R2 U' F2 L R' B' L2 B2 U2,13,4,0
      #{round.id},11,1,5,#{registration_ids[9]},4,9.30,B R' D F2 R' D L2 F' D2 B' U2 R2 B L2 F' D2 L' B' U',13,5,0
      #{round.id},11,1,1,#{registration_ids[10]},3,6.84,U' R2 U L2 D F2 L2 D2 R' B2 D L2 R2 B R2 B2 U2 F L',13,1,0
      #{round.id},11,1,2,#{registration_ids[10]},3,5.29,D' B2 R' B2 L2 D2 F R F R2 D F2 U L2 U R2 B2 D2 R2,13,2,0
      #{round.id},11,1,3,#{registration_ids[10]},3,5.73,F U R2 B2 U F2 D2 U' L D2 U2 L' D' R2 D' B2 F D2,13,3,0
      #{round.id},11,1,4,#{registration_ids[10]},3,7.60,U D2 B2 D2 U2 L' D2 L' R2 F2 R2 U' F2 L R' B' L2 B2 U2,13,4,0
      #{round.id},11,1,5,#{registration_ids[10]},3,6.58,B R' D F2 R' D L2 F' D2 B' U2 R2 B L2 F' D2 L' B' U',13,5,0
      #{round.id},11,2,1,#{registration_ids[9]},4,5.99,U2 B D B D2 R U D2 L B' D2 F2 U2 R2 D' B2 D R2 L2,14,1,0
      #{round.id},11,2,2,#{registration_ids[9]},4,5.38,B L2 B U F L' U2 F2 B' L' B L2 D2 B' R2 F2 L2 U2 F,14,2,0
      #{round.id},11,2,3,#{registration_ids[9]},4,7.55,R' F L2 D' B U F D R2 D2 B2 U' B2 U' B' L B' U2,14,3,0
      #{round.id},11,2,4,#{registration_ids[9]},4,5.56,R F' D F' D2 R' U2 D2 R L' F R2 L2 F R2 F' D2 F',14,4,0
      #{round.id},11,2,1,#{registration_ids[10]},3,6.07,U2 B D B D2 R U D2 L B' D2 F2 U2 R2 D' B2 D R2 L2,14,1,0
      #{round.id},11,2,2,#{registration_ids[10]},3,5.66,B L2 B U F L' U2 F2 B' L' B L2 D2 B' R2 F2 L2 U2 F,14,2,0
      #{round.id},11,2,3,#{registration_ids[10]},3,7.13,R' F L2 D' B U F D R2 D2 B2 U' B2 U' B' L B' U2,14,3,0
      #{round.id},11,2,4,#{registration_ids[10]},3,5.89,R F' D F' D2 R' U2 D2 R L' F R2 L2 F R2 F' D2 F',14,4,0
      #{round.id},11,3,1,#{registration_ids[9]},4,6.98,U' R B2 D2 F2 R U L' B' R U2 F2 L2 U' D2 L2 D' F2 D,15,1,0
      #{round.id},11,3,2,#{registration_ids[9]},4,7.98,U2 L' B U L2 U L2 F R2 F2 D2 R2 D F2 D' L2 U B2,15,2,0
      #{round.id},11,3,3,#{registration_ids[9]},4,4.91,U2 B U2 R2 F B2 U2 D2 L F2 D2 L2 D B2 D' R2 L2 U2 B,15,3,0
      #{round.id},11,3,4,#{registration_ids[9]},4,7.18,B D' U2 B2 L2 U2 B L2 U2 B L' U F L2 R' D L2 R B2,15,4,0
      #{round.id},11,3,5,#{registration_ids[9]},4,8.67,F' D B U2 B R2 D2 F R2 F' L R B U2 R D' F' D2,15,5,0
      #{round.id},11,3,1,#{registration_ids[10]},3,5.41,U' R B2 D2 F2 R U L' B' R U2 F2 L2 U' D2 L2 D' F2 D,15,1,0
      #{round.id},11,3,2,#{registration_ids[10]},3,5.68,U2 L' B U L2 U L2 F R2 F2 D2 R2 D F2 D' L2 U B2,15,2,0
      #{round.id},11,3,3,#{registration_ids[10]},3,6.11,U2 B U2 R2 F B2 U2 D2 L F2 D2 L2 D B2 D' R2 L2 U2 B,15,3,0
      #{round.id},11,3,4,#{registration_ids[10]},3,7.50,B D' U2 B2 L2 U2 B L2 U2 B L' U F L2 R' D L2 R B2,15,4,0
      #{round.id},11,3,5,#{registration_ids[10]},3,6.09,F' D B U2 B R2 D2 F R2 F' L R B U2 R D' F' D2,15,5,0
      #{round.id},12,1,1,#{registration_ids[8]},1,5.29,R L2 U2 B' R2 F D2 L2 D2 F2 U2 D L2 B R' F U2 L B' L,16,1,0
      #{round.id},12,1,2,#{registration_ids[8]},1,5.38,B' U L' D' F' R2 U L' D' F' L2 B2 L' F2 U2 D2 R U2 L D2,16,2,0
      #{round.id},12,1,3,#{registration_ids[8]},1,4.45,U' B2 R2 U L2 B2 F2 D U R B' U F2 L2 F' U' B' D' F,16,3,0
      #{round.id},12,1,4,#{registration_ids[8]},1,5.05,B L' U2 L D' U2 R2 D' B2 U F2 R2 F R' D2 F2 L2 U2 F,16,4,0
      #{round.id},12,1,5,#{registration_ids[8]},1,4.62,U R L' F D B2 U2 L2 F' D F2 B2 D2 F2 L2 U R2 B,16,5,0
      #{round.id},12,1,1,#{registration_ids[11]},2,4.94,R L2 U2 B' R2 F D2 L2 D2 F2 U2 D L2 B R' F U2 L B' L,16,1,0
      #{round.id},12,1,2,#{registration_ids[11]},2,3.93,B' U L' D' F' R2 U L' D' F' L2 B2 L' F2 U2 D2 R U2 L D2,16,2,0
      #{round.id},12,1,3,#{registration_ids[11]},2,6.38,U' B2 R2 U L2 B2 F2 D U R B' U F2 L2 F' U' B' D' F,16,3,0
      #{round.id},12,1,4,#{registration_ids[11]},2,6.85,B L' U2 L D' U2 R2 D' B2 U F2 R2 F R' D2 F2 L2 U2 F,16,4,0
      #{round.id},12,1,5,#{registration_ids[11]},2,7.00,U R L' F D B2 U2 L2 F' D F2 B2 D2 F2 L2 U R2 B,16,5,0
      #{round.id},12,2,1,#{registration_ids[8]},1,5.68,F' U L B2 D2 R2 F2 R' F2 L B L' F' L' D U2 B2 R2,17,1,0
      #{round.id},12,2,2,#{registration_ids[8]},1,4.43,L D' U2 R U2 B2 L D2 U2 B L F' D' F2 L B' D' R',17,2,0
      #{round.id},12,2,3,#{registration_ids[8]},1,4.49,B L2 U2 F' D2 U2 L2 F' D' B' U' F2 R' D F' U B2 D' U,17,3,0
      #{round.id},12,2,1,#{registration_ids[11]},2,7.20,F' U L B2 D2 R2 F2 R' F2 L B L' F' L' D U2 B2 R2,17,1,0
      #{round.id},12,2,2,#{registration_ids[11]},2,4.49,L D' U2 R U2 B2 L D2 U2 B L F' D' F2 L B' D' R',17,2,0
      #{round.id},12,2,3,#{registration_ids[11]},2,5.93,B L2 U2 F' D2 U2 L2 F' D' B' U' F2 R' D F' U B2 D' U,17,3,0
      #{round.id},12,3,1,#{registration_ids[8]},1,5.03,D2 B2 U2 B2 D' L2 U2 R U2 B2 U' L2 B' R' U2 L2 B' F,18,1,0
      #{round.id},12,3,2,#{registration_ids[8]},1,5.86,B' U2 R' B U' R D2 B' U' L2 U' B2 R2 U2 R2 U2 L2 D B2 L2,18,2,0
      #{round.id},12,3,3,#{registration_ids[8]},1,4.81,U2 F2 L2 F2 D2 L' D B2 U2 F2 D2 L2 F U2 F D2 U' L,18,3,0
      #{round.id},12,3,4,#{registration_ids[8]},1,4.13,F' D L2 D2 L2 B' F' D2 B R2 L' D B' D2 U' B U' L' F,18,4,0
      #{round.id},12,3,1,#{registration_ids[11]},2,5.96,D2 B2 U2 B2 D' L2 U2 R U2 B2 U' L2 B' R' U2 L2 B' F,18,1,0
      #{round.id},12,3,2,#{registration_ids[11]},2,5.68,B' U2 R' B U' R D2 B' U' L2 U' B2 R2 U2 R2 U2 L2 D B2 L2,18,2,0
      #{round.id},12,3,3,#{registration_ids[11]},2,5.59,U2 F2 L2 F2 D2 L' D B2 U2 F2 D2 L2 F U2 F D2 U' L,18,3,0
      #{round.id},12,3,4,#{registration_ids[11]},2,6.16,F' D L2 D2 L2 B' F' D2 B R2 L' D B' D2 U' B U' L' F,18,4,0
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
      expect(LiveResult.count).to be(12)
      expect(Result.count).to be(0)
      expect(H2hMatch.count).to be(12)
      expect(H2hMatchCompetitor.count).to be(24)
      expect(H2hSet.count).to be(18)
      expect(LiveAttempt.count).to be(148)
      expect(ResultAttempt.count).to be(0)
      expect(H2hAttempt.count).to be(148)
      expect(H2hAttempt.where(live_attempt_id: nil).count).to be(0)
      expect(H2hAttempt.where(result_attempt_id: nil).count).to be(148)
      expect(InboxScrambleSet.count).to be(18)
      expect(InboxScramble.count).to be(74)
      expect(Scramble.count).to be(0)
    end

    it 'creates valid LiveResults' do
      LiveResult.find_each do |lr|
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

    it 'creates/deletes the expected number of model objects' do
      expect(LiveResult.count).to be(0)
      expect(Result.count).to be(12)
      expect(H2hMatch.count).to be(12)
      expect(H2hMatchCompetitor.count).to be(24)
      expect(H2hSet.count).to be(18)
      expect(LiveAttempt.count).to be(0)
      expect(ResultAttempt.count).to be(148)
      expect(H2hAttempt.count).to be(148)
      expect(H2hAttempt.where(live_attempt_id: nil).count).to be(148)
      expect(H2hAttempt.where(result_attempt_id: nil).count).to be(0)
      expect(InboxScrambleSet.count).to be(0)
      expect(InboxScramble.count).to be(0)
      expect(Scramble.count).to be(74)


      # Assigns the correct pos placements
      reg10 = Registration.find(registration_ids[10])
      reg10_placement = Result.find_by(round: round, competition: reg10.competition, person: reg10.person).pos
      expect(reg10_placement).to be(3)
    end
  end
end
