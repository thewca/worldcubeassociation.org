module Statistics
  class BlindfoldedRecentSuccessRate < AbstractStatistic
    def initialize(q)
      super
      @last_year = Date.today - 1.year
    end

    def name
      "Rubik's Cube Blindfolded recent success rate"
    end

    def subtitle
      "since #{@last_year.to_formatted_s(:rfc822)}, minimum 5 attempts"
    end

    def info
      nil
    end

    def id
      "blindfolded_3x3_recent_success_rate"
    end

    def tables
      header = [LeftTh.new("Person"),
                RightTh.new("Rate"),
                RightTh.new("Solves"),
                RightTh.new("Attempts"),
                RightTh.new("Best"),
                RightTh.new("Avg"),
                RightTh.new("Worst"),
               ]
      # TODO: make use of JOIN
      bld_results = @q.call(<<-SQL
        SELECT personId, personName, value1, value2, value3, value4, value5
        FROM   Results r, Competitions c
        WHERE  eventId='333bf' AND c.id=r.competitionId AND CAST(CONCAT(c.year,'-',c.month,'-',c.day) as Date) >= '#{@last_year.iso8601}'
      SQL
      )
      #hash :: Hash (PersonId, PersonName) (DNFCount, Attempts)

      counter = Hash.new { |h, k| h[k] = [0, []] }
      bld_results.each do |row|
        attempts, solves = counter[[row[0], row[1]]]
        counter[[row[0], row[1]]] = [attempts + attempt_count(row[2..-1]), solves + successful_solves(row[2..-1])]
      end

      result = counter.select do |(_, _), (attempt_count, _)|
        attempt_count >= 5
      end.sort_by do |((_person_id, _person_name), (attempt_count, solves))|
        return [-1, 0, 0] if attempt_count == 0
        # Sort by
        # * success rate
        # * attempts
        # * average
        [solves.size.fdiv(attempt_count), attempt_count, solves.size == 0 ? 0 : solves.reduce(0, &:+).fdiv(solves.size)]
      end.reverse

      body = result.take(10).map do |((person_id, person_name), (attempt_count, solves))|
        [ PersonTd.new(person_id, person_name),
          PercentageTd.new(solves.size.fdiv(attempt_count)),
          NumberTd.new(solves.size),
          NumberTd.new(attempt_count),
          TimeTd.new(solves.min, :green),
          TimeTd.new(solves.inject(0, &:+).fdiv(solves.size)),
          TimeTd.new(solves.max, :red),
        ]
      end

      [Table.new(header, body)]
    end

    private def success_count(solves)
      solves.count { |s| s > 0 }
    end

    private def attempt_count(solves)
      solves.count { |s| s > 0 || s == SolveTime::DNF_VALUE }
    end

    private def successful_solves(solves)
      solves.select { |s| s > 0 }
    end
  end
end
