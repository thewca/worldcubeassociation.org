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
      "<th>#{value}</th>".html_safe
    end
  end

  EmptyTh = Struct.new(:value) do
    def render
      '<th class="f">&nbsp;</th>'.html_safe
    end
  end

  def self.merge(sub_tables, spacer: SpacerTd.new, empty: EmptyTd.new)
    return [] if sub_tables.all?(&:empty?)

    row_count_of_longest_sub_table = sub_tables.map(&:length).max
    # Calling first is safe since we know there's at least one
    # non-empty sub_table.
    column_count = sub_tables.max_by(&:length).first.length
    result = []
    0.upto(row_count_of_longest_sub_table - 1) do |i|
      # for each table we grab the `i`th row and join it using `SpacerTd`
      row_parts = []
      sub_tables.each do |table|
        current_row = table[i] || ([empty] * column_count)
        row_parts << current_row + [spacer]
      end
      row_parts = row_parts.flatten[0...-1]
      result << row_parts
    end
    result
  end

  def self.all
    [
      Statistics::BestMedalCollection.new,
      Statistics::Top100.new,
      Statistics::MostCompetitions.new,
    ]
  end
end
