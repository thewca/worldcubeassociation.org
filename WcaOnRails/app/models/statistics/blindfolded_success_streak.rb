module Statistics
  class BlindfoldedSuccessStreak < AbstractStatistic
    # I actually want a ADT here, simulating it with
    # classes...

    DateValuePair = Struct.new(:date, :value)

    class Streak
      def initialize
        @times = []
        @finished = false
      end

      def <<(date_time)
        time = date_time.value
        fail ArgumentError.new("must be a postive integer") unless time.is_a?(Fixnum) && time > 0
        @times << date_time
      end

      def finish!
        @finished = true
      end

      def finished?
        @finished
      end

      def size
        @times.size
      end

      def mean
        @times.map(&:value).reduce(0, :+).fdiv(@times.size)
      end

      def best
        @times.map(&:value).min
      end

      def worst
        @times.map(&:value).max
      end

      def <=>(other)
        # Prevent self.best comparision if one
        # streak doesn't have a best time
        if self.size * other.size == 0
          self.size <=> other.size
        else
          [self.size, -self.best] <=> [other.size, -other.best]
        end
      end

      # Note: This doesn't return a Range, but a tuple in order
      # to represent open ended ranges.
      # I probably should stop being lazy and implement these ranges
      # myself.
      def date_range
        raise RuntimeError.new("the streak doesn't have any times yet") if self.size == 0
        if @finished
          [@times.first.date, @times.last.date]
        else
          [@times.first.date, nil]
        end
      end
    end

    def name; "Rubik's Cube Blindfolded longest success streak"; end
    def subtitle; nil; end
    def info; nil; end
    def id; "blind_streak_3x3"; end

    def headers
      [ LeftTh.new('Person'),
        RightTh.new('Length'),
        RightTh.new('Best'),
        RightTh.new('Average'),
        RightTh.new('Worst'),
        LeftTh.new('When?'),
      ]
    end

    def tables
      bf_results = @q.(<<-SQL
        SELECT personId, personName, value1, value2, value3, value4, value5, year, month
        FROM Results result, Competitions competition
        WHERE eventId = '333bf'
          AND competition.id = competitionId
        ORDER BY personId, year, month, day, roundId
        SQL
      )

      # [person_id, person_name] -> [streaks]
      streaks = Hash.new { |h, k| h[k] = [Streak.new] }
      bf_results.each do |row|
        person = [row[0], row[1]]
        # Go through all 5 solves
        1.upto(5) do |i|
          time = row[i + 1]
          if time > 0 # valid solve
            # TODO tell, don't ask violation
            if streaks[person].last.finished?
              new_streak = Streak.new
              streaks[person] << new_streak
            end
            streaks[person].last << DateValuePair.new(Date.new(row[7], row[8], 1), time)
          elsif time == -1 || time == -2 # dnf or dns
            streaks[person].last.finish!
          else # no solve
            # skip it
          end
        end
      end

      best_streaks = streaks.map do |person, streaks|
        [person, streaks.max]
      end.sort_by { |f| f.last }.reverse!.take(10)

      rows = best_streaks.map do |row|
        streak = row.last
        person_id, person_name = row.first
        [ PersonTd.new(person_id, person_name),
          NumberTd.new(streak.size),
          TimeTd.new(streak.best, :green),
          TimeTd.new(streak.mean),
          TimeTd.new(streak.worst, :red),
          DateRangeTd.new(streak.date_range)
        ]
      end

      [Table.new(headers, rows)]
    end
  end
end
