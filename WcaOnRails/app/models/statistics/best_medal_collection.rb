module Statistics
  class BestMedalCollection
    def name; 'Best "medal collection"'; end
    def subtitle; "3x3x3 and overall"; end
    def info; nil; end
    def id; 'medal_collection'; end

    def headers
      [ LeftTh.new('Person'),
        RightTh.new('Gold'),
        RightTh.new('Silver'),
        RightTh.new('Bronze'),
        SpacerTh.new,
        LeftTh.new('Person'),
        RightTh.new('Gold'),
        RightTh.new('Silver'),
        RightTh.new('Bronze'),
        EmptyTh.new,
      ]
    end

    def rows
      q = -> (query) { ActiveRecord::Base.connection.execute(query) }
      just_three = q.(<<-SQL
        SELECT
          personId,
          personName,
          count(pos=1 or null) gold,
          count(pos=2 or null) silver,
          count(pos=3 or null) bronze
        FROM Results
        WHERE roundId IN ('f', 'c') AND eventId='333'
        GROUP BY personId
        ORDER BY gold DESC, silver DESC, bronze DESC, personName
        LIMIT 10
        SQL
      ).map do |row|
        [ PersonTd.new(row[0], row[1]),
          BoldNumberTd.new(row[2]),
          NumberTd.new(row[3]),
          NumberTd.new(row[4]),
        ]
      end

      all = q.(<<-SQL
        SELECT
          personId,
          personName,
          count(pos=1 or null) gold,
          count(pos=2 or null) silver,
          count(pos=3 or null) bronze
        FROM Results
        WHERE roundId IN ('f', 'c') AND best>0
        GROUP BY personId
        ORDER BY gold DESC, silver DESC, bronze DESC, personName
        LIMIT 10
        SQL
      ).map do |row|
        [ PersonTd.new(row[0], row[1]),
          BoldNumberTd.new(row[2]),
          NumberTd.new(row[3]),
          NumberTd.new(row[4]),
        ]
      end

      Statistics::merge([just_three, all])
    end
  end
end
