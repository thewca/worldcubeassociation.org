module Statistics
  class Top100
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
      q = -> (query) { ActiveRecord::Base.connection.execute(query) }

      single_bound = 991;

      average_top100 = <<-SQL
      SELECT   personId,
               personName
      FROM     Results
      WHERE    eventId='333' AND average>0
      ORDER BY average
      LIMIT 100
      SQL
      average_candidates = q.(<<-SQL
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

      singles = 1.upto(5).map do |i|
        <<-SQL
          SELECT   personId,
                   personName,
                   value#{i}
          FROM     Results
          WHERE    best<#{single_bound} AND best>0 AND value#{i}>0 AND eventId='333'
          LIMIT    100
          SQL
      end.join("UNION ALL\n")
      single_candidates = q.(<<-SQL
        SELECT   personId,
                 personName,
                 COUNT(personId) AS appearances
        FROM     (#{singles}) AS singles
        GROUP BY personId, personName
        ORDER BY appearances DESC
        LIMIT    10
        SQL
      ).map do |row|
        [PersonTd.new(row[0], row[1]), BoldNumberTd.new(row[2])]
      end

      Statistics::merge(single_candidates, average_candidates)
    end
  end
end
