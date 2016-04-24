module Statistics
  class MostWorldRecords < AbstractStatistic
    def name
      "World records in most events"
    end

    def subtitle
      "current and past"
    end

    def info
      nil
    end

    def id
      "most_world_records"
    end

    def tables
      person_records = @q.call(<<-SQL
        SELECT personId, personName, COUNT(DISTINCT eventId) AS worldRecordCount
        FROM Results
        WHERE regionalSingleRecord='WR' OR regionalAverageRecord='WR'
        GROUP BY personId
        ORDER BY worldRecordCount DESC, personName
        LIMIT 10
      SQL
      ).map do |row|
        [ PersonTd.new(row[0], row[1]),
          NumberTd.new(row[2]),
        ]
      end

      competition_records = @q.call(<<-SQL
        SELECT competitionId, Competitions.cellName, COUNT(DISTINCT eventId) AS worldRecordCount
        FROM Results, Competitions
        WHERE competitionId=Competitions.id AND (regionalSingleRecord='WR' OR regionalAverageRecord='WR')
        GROUP BY competitionId
        ORDER BY worldRecordCount DESC, competitionId
        LIMIT 10
      SQL
      ).map do |row|
        [ CompetitionTd.new(row[0], row[1]),
          NumberTd.new(row[2]),
        ]
      end

      country_records = @q.call(<<-SQL
        SELECT countryId, COUNT(DISTINCT eventId) AS worldRecordCount
        FROM Results
        WHERE regionalSingleRecord='WR' OR regionalAverageRecord='WR'
        GROUP BY countryId
        ORDER BY worldRecordCount DESC, countryId
        LIMIT 10
      SQL
      ).map do |row|
        [ CountryTd.new(row[0], Country.find(row[0]).name),
          NumberTd.new(row[1]),
        ]
      end

      country_table = Table.new([LeftTh.new("Country"), RightTh.new("Events")], country_records)
      competition_table = Table.new([LeftTh.new("Competition"), RightTh.new("Events")], competition_records)
      person_table = Table.new([LeftTh.new("Person"), RightTh.new("Events")], person_records)

      [ person_table,
        competition_table,
        country_table,
      ]
    end
  end
end
