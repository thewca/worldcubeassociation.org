require 'solve_time'

module Statistics
  class OldestStandingRecords < AbstractStatistic
    def name; "Oldest standing world records"; end
    def info
      "Since we don't have the schedules, the first day of the competition is assumed here and thus the ages might be slightly off."
    end
    def id; "oldest_records"; end

    def tables
      rows = @q.(<<-SQL
        SELECT
          event.id eventId,
          type,
          datediff( curdate(), year*10000+month*100+day ) days,
          value,
          personId,
          personName,
          competitionId,
          competition.cellName
        FROM
          (SELECT eventId, min(best) value, 'Single' type
           FROM ConciseSingleResults
           GROUP BY eventId
             UNION
           SELECT eventId, min(average) value, 'Average' type
           FROM ConciseAverageResults
           GROUP BY eventId) record,
          Results result,
          Competitions competition,
          Events event

          WHERE ((type = 'Single' AND result.best = record.value) OR (type = 'Average' AND result.average = record.value))
          AND result.eventId = record.eventId

          AND competition.id = result.competitionId
          AND event.id       = result.eventId
          AND event.rank < 990
        ORDER BY
          year, month, day, type DESC, event.rank
        LIMIT 10
      SQL
      ).map do |row|
        e = Event.find(row[0])
        [
          EventTd.new(e.id, e.name),
          TextTd.new(row[1]),
          BoldNumberTd.new(row[2]),
          SolveTd.new(SolveTime.new(e.id, row[1].downcase, row[3])),
          PersonTd.new(row[4], row[5]),
          CompetitionTd.new(row[6], row[7]),
        ]
      end
      header = [
        LeftTh.new("Event"),
        LeftTh.new("Type"),
        RightTh.new("Days"),
        RightTh.new("Result"),
        LeftTh.new("Person"),
        LeftTh.new("Competition"),
      ]

      [Table.new(header, rows)]
    end
  end
end
