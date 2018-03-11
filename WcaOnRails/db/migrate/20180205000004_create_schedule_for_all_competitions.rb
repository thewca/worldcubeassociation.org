class CreateScheduleForAllCompetitions < ActiveRecord::Migration[5.1]
  def up
    Competition.find_each do |competition|
      competition.create_schedule! unless competition.competition_schedule
    end
  end
end
