module Statistics
  class Top100 < AbstractStatistic
    def name; "Appearances in Rubik's Cube top 100 results"; end
    def subtitle; "Single | Average"; end
    def info; nil; end
    def id; "appearances_top100_3x3"; end

    def headers
      [ LeftTh.new('Person'),
        RightTh.new('Appearances'),
        SpacerTh.new,
        LeftTh.new('Person'),
        RightTh.new('Appearances'),
        EmptyTh.new,
      ]
    end

    def rows
      top100 = @q.(<<-SQL
        SELECT   average
        FROM     Results
        WHERE    eventId='333' AND average>0
        ORDER BY average
        LIMIT    100
      SQL
      )
      average_of_rank_100 = 0
      top100.each { |r| average_of_rank_100 = r[0] }

      average_top100 = <<-SQL
      SELECT   personId,
               personName
      FROM     Results
      WHERE    eventId='333' AND average>0 AND average<=#{average_of_rank_100}
      SQL
      average_candidates = @q.(<<-SQL
        SELECT   personId,
                 personName,
                 COUNT(personId) AS appearances
        FROM     (#{average_top100}) AS top100
        GROUP BY personId, personName
        ORDER BY appearances DESC
        LIMIT    10
        SQL
      ).map do |row|
        [PersonTd.new(row[0], row[1]), BoldNumberTd.new(row[2])]
      end


      trips = []
      @q.(<<-SQL
        SELECT   personId,
                 personName,
                 value1,
                 value2,
                 value3,
                 value4,
                 value5
        FROM     Results
        WHERE    best>0 AND eventId='333'
        ORDER BY best
        LIMIT    110
        SQL
      ).each do |row|
        2.upto(6) do |i|
          trips << [row[0], row[1], row[i]] if row[i] > 0
        end
      end
      trips = trips.sort_by { |r| r[2] }
      single_for_rank_100 = trips[[trips.size - 1, 100].min][2]
      trips = trips.select { |r| r[2] <= single_for_rank_100 }
      counts = count(trips)
      counts = counts.to_a.map(&:flatten).sort_by { |r| -r[2] }
      single_candidates = counts[0..9].map do |id, name, count|
        [PersonTd.new(id, name), BoldNumberTd.new(count)]
      end

      Statistics::merge([single_candidates, average_candidates])
    end

    private
    def count(trips)
      counts = Hash.new { |h, k| h[k] = 0 }
      trips.each do |r|
        counts[[r[0], r[1]]] += 1
      end
      counts
    end
  end
end
