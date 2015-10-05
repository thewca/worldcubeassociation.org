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

  class EndSpacerTd
    def render
      '<td class="f">&nbsp;</td>'.html_safe
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

  def self.merge(*sub_tables)
    sub_tables.first.zip(*sub_tables[1..-1]).map do |args|
      empty = [EmptyTd.new] * 2
      args.map { |e| e || empty }.inject([]) { |a, v| a + v + [SpacerTd.new] }[0...-1] + [EndSpacerTd.new]
    end
  end

  def self.all
    [
      Statistics::BestMedalCollection.new,
      Statistics::Top100.new,
      Statistics::MostCompetitions.new,
    ]
  end
end
