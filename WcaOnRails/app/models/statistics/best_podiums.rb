module Statistics
  class BestPodiums < AbstractStatistic
    def name
      "Best Podiums in Rubik's Cube event"
    end

    def id
      "best_podiums"
    end

    def tables
      top3s = []
      results = @q.call(<<-SQL
        SELECT average, competitionId, personId, personName, c.cellName
        FROM Results, Competitions c
        WHERE pos <= 3 AND eventId='333' AND formatId='a' AND average>0 AND roundId in ('f', 'c')
        AND Results.competitionId = c.id
        ORDER BY competitionId, roundId, pos
      SQL
      ).to_a.group_by { |row| row[1] }.sort_by do |compId, top3|
        if top3.size >= 3
          top3.sum { |t| t[0] }
        else
          100000000
        end
      end.take(10).map do |compId, top3|
        [ CompetitionTd.new(compId, top3[0][4]),
          TimeTd.new(top3.sum { |t| t[0] }, nil, true),
          PersonTd.new(top3[0][2], top3[0][3]),
          TimeTd.new(top3[0][0]),
          PersonTd.new(top3[1][2], top3[1][3]),
          TimeTd.new(top3[1][0]),
          PersonTd.new(top3[2][2], top3[2][3]),
          TimeTd.new(top3[2][0]),
        ]
      end

      headers = [
        LeftTh.new("Competition"),
        RightTh.new("Sum"),
        LeftTh.new("First"),
        EmptyTh.new,
        LeftTh.new("Second"),
        EmptyTh.new,
        LeftTh.new("Third"),
        EmptyTh.new,
      ]

      [ Table.new(headers, results) ]
    end
  end
end
