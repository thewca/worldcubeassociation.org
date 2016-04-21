module Statistics
  class MostSubXSolves < AbstractStatistic
    def initialize(q, limits)
      @limits = limits
      super(q)
    end

    def name
      "Most Sub-X solves in Rubik's Cube"
    end

    def subtitle
      nil
    end

    def info
      nil
    end

    def id
      "subx_3x3_solves"
    end

    def tables
      top_results = @q.call(<<-SQL
        SELECT personId, personName, value1, value2, value3, value4, value5
        FROM   Results
        WHERE  eventId='333' AND best > 0 AND best < #{@limits.max * 100}
      SQL
      )
      @limits.map do |limit|
        sub_table(top_results, limit)
      end
    end

    private def sub_table(results, limit)
      counts_hash = Hash.new { |h, k| h[k] = 0 }

      results.each do |row|
        5.times do |i|
          counts_hash[[row[0], row[1]]] += 1 if row[2 + i] < limit * 100 && row[2 + i] > 0
        end
      end
      header = [LeftTh.new("Name"), RightTh.new("<#{limit}")]
      body = counts_hash.sort_by do |_person, count|
        -count
      end[0..9].map do |((id, name), count)|
        [PersonTd.new(id, name), BoldNumberTd.new(count)]
      end
      Table.new(header, body)
    end
  end
end
