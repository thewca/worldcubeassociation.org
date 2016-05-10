module Statistics
  class MostSolvesInOneCompetitionOrYear < AbstractStatistic
    def name
      "Most solves in one competition or year"
    end

    def id
      "most_solves_in_competitions"
    end

    def tables
      by_competitions = @q.call(<<-SQL
        SELECT    personId,
                  personName,
                  competitionId,
                  competition.name,
                  count(value1>0 or null)+
                  count(value2>0 or null)+
                  count(value3>0 or null)+
                  count(value4>0 or null)+
                  count(value5>0 or null) solves,
                  count(value1 and value1<>-2 or null)+
                  count(value2 and value2<>-2 or null)+
                  count(value3 and value3<>-2 or null)+
                  count(value4 and value4<>-2 or null)+
                  count(value5 and value5<>-2 or null) attempts
        FROM      Results, Competitions competition
        WHERE     competition.id = Results.competitionId
        GROUP BY  personId, competitionId
        ORDER BY  solves DESC, attempts
        LIMIT     50
      SQL
      ).to_a.uniq { |row| row[0] }.take(10).map do |row|
        [PersonTd.new(row[0], row[1]), FractionTd.new(row[4], row[5]), CompetitionTd.new(row[2], row[3])]
      end
      by_year = @q.call(<<-SQL
        SELECT    personId,
                  personName,
                  year,
                  count(value1>0 or null)+
                  count(value2>0 or null)+
                  count(value3>0 or null)+
                  count(value4>0 or null)+
                  count(value5>0 or null) solves,
                  count(value1 and value1<>-2 or null)+
                  count(value2 and value2<>-2 or null)+
                  count(value3 and value3<>-2 or null)+
                  count(value4 and value4<>-2 or null)+
                  count(value5 and value5<>-2 or null) attempts
        FROM      Results, Competitions competition
        WHERE     competition.id = competitionId
        GROUP BY  personId, year
        ORDER BY  solves DESC, attempts
        LIMIT     50
      SQL
      ).to_a.uniq { |row| row[0] }.take(10).map do |row|
        [PersonTd.new(row[0], row[1]), FractionTd.new(row[3], row[4]), YearTd.new(row[2])]
      end
      [ Table.new([LeftTh.new('Person'), RightTh.new('Solves'), LeftTh.new('Competition')], by_competitions),
        Table.new([LeftTh.new('Person'), RightTh.new('Solves'), RightTh.new('Year')], by_year),
      ]
    end
  end
end
