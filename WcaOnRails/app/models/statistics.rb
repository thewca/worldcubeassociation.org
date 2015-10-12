require_relative './statistics/blindfolded_3x3_success_streak'

module Statistics
  PersonTd = Struct.new(:id, :name) do
    include ActionView::Helpers::FormHelper
    include PathHelper

    def render
      name = self.name.split('(').first.strip
      "<td>#{link_to name, person_path(id), class: "p"}</td>".html_safe
    end
  end

  EmptyTd = Class.new do
    def render
      "<td></td>".html_safe
    end
  end

  EventTd = Struct.new(:id, :name) do
    include ActionView::Helpers::FormHelper
    include PathHelper

    def render
      "<td>#{link_to name, event_path(id), class: "e"}</td>".html_safe
    end
  end

  CountryTd = Struct.new(:id, :name) do
    include ActionView::Helpers::FormHelper
    include PathHelper

    def render
      "<td class=\"L\">#{name}</td>".html_safe
    end
  end

  class SpacerTd
    def render
      '<td class="L"> &nbsp; &nbsp; | &nbsp; &nbsp; </td>'.html_safe
    end
  end

  BoldNumberTd = Struct.new(:value) do
    def render
      "<td class=\"R2\">#{value}</td>".html_safe
    end
  end

  NumberTd = Struct.new(:value) do
    def render
      "<td class=\"r\">#{value}</td>".html_safe
    end
  end

  TimeTd = Struct.new(:time) do
    def render
      minutes = (time / 6000).to_i
      seconds = time.fdiv(100) - minutes * 60
      format = if minutes > 0
        "%d:%05.2f" % [minutes, seconds]
      else
        "%.2f" % seconds
      end
      "<td class=\"r\">#{format}</td>".html_safe
    end
  end

  RedNumberTd = Struct.new(:value) do
    def render
      "<td class\"r\"><span style=\"color:#F00\">#{value}</span></td>".html_safe
    end
  end

  class SpacerTh
    def render
      "<th class=\"L\">&nbsp; &nbsp; | &nbsp; &nbsp;</th>".html_safe
    end
  end

  RightTh = Struct.new(:value) do
    def render
      "<th class=\"R2\">#{value}</th>".html_safe
    end
  end

  LeftTh = Struct.new(:value) do
    def render
      "<th class=\"L\">#{value}</th>".html_safe
    end
  end

  TrailingTh = Struct.new(:value) do
    def render
      '<th class="f">&nbsp;</th>'.html_safe
    end
  end

  class EmptyTh
    def render
      '<th>&nbsp;</th>'.html_safe
    end
  end

  class EmptyTd
    def render
      '<td>&nbsp;</td>'.html_safe
    end
  end

  DateRangeTd = Struct.new(:date_range) do
    def render
      from_time = date_range.first.strftime("%b %Y")
      end_time = if date_range.last.nil?
          "<b>ongoing...</b>"
        else
          date_range.last.strftime("%b %Y")
        end
      "<td>#{from_time} - #{end_time}</td>".html_safe
    end
  end

  def self.merge(sub_tables, spacer: SpacerTd.new, empty: EmptyTd.new)
    return [] if sub_tables.all?(&:empty?)

    row_count_of_longest_sub_table = sub_tables.map(&:length).max
    # Calling first is safe since we know there's at least one
    # non-empty sub_table.
    column_count = sub_tables.max_by(&:length).first.length
    0.upto(row_count_of_longest_sub_table - 1).map do |i|
      # for each table we grab the `i`th row and join it using `SpacerTd`
      row_parts = []
      sub_tables.each do |table|
        current_row = table[i] || ([empty] * column_count)
        row_parts << current_row + [spacer]
      end
      row_parts.flatten[0...-1]
    end
  end

  def self.all
    q = -> (query) { ActiveRecord::Base.connection.execute(query) }
    [
      Statistics::BestMedalCollection.new(q),
      # TODO Are we fine with data - code coupling?
      Statistics::SumOfRanks.new(q, ['333', '444', '555'],
                                 name: "Sum of 3x3/4x4/5x5 ranks",
                                 subtitle: "Single | Average",
                                 id: "sum_ranks_345"),
      Statistics::SumOfRanks.new(q, Event.all.select(&:official?).map(&:id),
                                 name: "Sum of all single ranks",
                                 subtitle: nil,
                                 id: "sum_ranks_single",
                                 type: :single),
      Statistics::SumOfRanks.new(q, Event.all.select(&:official?).select(&:has_average_results?).map(&:id),
                                 name: "Sum of all average ranks",
                                 subtitle: nil,
                                 id: "sum_ranks_single",
                                 type: :average),
      Statistics::Top100.new(q),
      Statistics::Blindfolded3x3SuccessStreak.new(q),
      Statistics::MostCompetitions.new(q),
    ]
  end
end
