require 'benchmark'

module Statistics
  class SumOfRanks < AbstractStatistic
    def initialize(q, event_ids, name:, just_single: false)
      super(q)
      @event_ids = event_ids
      @name = name
      @just_single = just_single
    end

    attr_reader :name
    def subtitle; "Single | Average"; end
    def info; nil; end
    def id; "sum_ranks_345"; end

    def headers
      event_headers = @event_ids.map { |e| RightTh.new(e) }
      if @just_single
        [ LeftTh.new('Person') ] +
          [ RightTh.new('Sum') ] +
          event_headers +
          [ EmptyTh.new ]
      else
        [ LeftTh.new('Person') ] +
          [ RightTh.new('Sum') ] +
          event_headers +
          [ SpacerTh.new ] +
          [ RightTh.new('Sum') ] +
          event_headers +
          [ EmptyTh.new ]
      end
    end

    def rows
      if @just_single
        get_sum_table_for('Single')
      else
        Statistics.merge([get_sum_table_for('Single'), get_sum_table_for('Average')])
      end
    end

    private
    def get_sum_table_for(type)
      event_id_filter = @event_ids.map do |id|
        "eventId='#{id}'"
      end.join(" OR ")
      events_hash = Hash.new { |h, k| h[k] = {} }
      @q.(<<-SQL
        SELECT   personId, name, eventId, worldRank
        FROM     Ranks#{type}
        JOIN     Persons ON Persons.id=Ranks#{type}.personId
        WHERE    #{event_id_filter}
        SQL
      ).each do |row|
        events_hash[row[2]][[row[0], row[1]]] = row[3]
      end
      penalties = {}
      events_hash.each do |event, person_rank|
        penalties[event] = person_rank.size + 1
      end
      penalty_sum = penalties.values.reduce(0, :+)
      rank_sum = Hash.new(0)
      events_hash.each do |event, person_rank|
        person_rank.each do |person_pair, rank|
          rank_sum[person_pair] += rank - penalties[event]
        end
      end

      rank_sum.keys.each do |person_pair|
        rank_sum[person_pair] += penalty_sum
      end

      rank_sum.to_a.sort_by { |(_, rank)| rank }[0..9].map do |r|
        front = [PersonTd.new(r[0][0], r[0][1]), BoldNumberTd.new(r[1])]
        rest = @event_ids.map do |id|
          rank = events_hash[id][r[0]]
          if rank
            NumberTd.new(rank)
          else
            RedNumberTd.new(penalties[id])
          end
        end
        front + rest
      end
    end
  end
end
