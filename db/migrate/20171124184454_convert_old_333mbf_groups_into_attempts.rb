# frozen_string_literal: true

class ConvertOld333mbfGroupsIntoAttempts < ActiveRecord::Migration[5.1]
  def up
    ActiveRecord::Base.transaction do
      # v2.4 of the Workbook Assistant (with support for 333mbf groups) was released on 25th September 2017.
      # See: https://www.worldcubeassociation.org/wca-workbook-assistant-versions
      scramble_query = Scramble.joins(:competition).where(eventId: "333mbf").where("end_date < '2017-09-25'")
      scrambles = scramble_query.to_a
      scramble_query.delete_all

      scrambles.group_by { |s| [s.competitionId, s.roundTypeId, s.groupId] }.each do |compId_rtId_groupId, scramble_objs|
        competitionId, roundTypeId, groupId = compId_rtId_groupId
        scramble = scramble_objs.map(&:scramble).join("\n")

        scrambleNum = {
          "A" => 1,
          "B" => 2,
          "C" => 3,
          "D" => 4,
          "E" => 5,
          "F" => 6,
        }[groupId]
        raise "Unrecognized groupId #{groupId}" if scrambleNum.nil?

        Scramble.create!(
          competitionId: competitionId,
          eventId: "333mbf",
          roundTypeId: roundTypeId,
          groupId: "A",
          isExtra: false,
          scrambleNum: scrambleNum,
          scramble: scramble,
        )
      end
    end
  end
end
