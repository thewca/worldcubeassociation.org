module Statistics
  PersonTd = Struct.new(:id, :name) do
    include ActionView::Helpers::FormHelper
    include PathHelper

    def render
      name = self.name.split('(').first.strip
      "<td>#{link_to name, person_path(id)}</td>".html_safe
    end
  end

  EventTd = Struct.new(:id, :name) do
    include ActionView::Helpers::FormHelper
    include PathHelper

    def render
      "<td>#{link_to name, event_path(id)}</td>".html_safe
    end
  end

  CountryTd = Struct.new(:id, :name) do
    def render
      "<td>#{name}</td>".html_safe
    end
  end

  CompetitionTd = Struct.new(:id, :name) do
    include ActionView::Helpers::FormHelper

    def render
      "<td>#{link_to name, Rails.application.routes.url_helpers.competition_path(id)}</td>".html_safe
    end
  end

  BoldNumberTd = Struct.new(:value) do
    def render
      "<td class=\"text-right\"><strong>#{value}</strong></td>".html_safe
    end
  end

  NumberTd = Struct.new(:value) do
    def render
      "<td class=\"text-right\">#{value}</td>".html_safe
    end
  end

  FractionTd = Struct.new(:value1, :value2) do
    def render
      "<td class=\"text-right\"><strong>#{value1}</strong> / #{value2}</td>".html_safe
    end
  end

  YearTd = Struct.new(:year) do
    def render
      "<td class=\"text-right\"><strong>#{year}</strong></td>".html_safe
    end
  end

  PercentageTd = Struct.new(:value) do
    def render
      "<td class=\"text-right\">#{"%.2f %" % (value * 100)}</td>".html_safe
    end
  end

  TimeTd = Struct.new(:time, :color, :bold) do
    def render
      minutes = (time / 6000).to_i
      seconds = time.fdiv(100) - minutes * 60
      format = if minutes > 0
        "%d:%05.2f" % [minutes, seconds]
      else
        "%.2f" % seconds
      end
      inner = if bold
                "<strong>#{format}</strong>"
              else
                format
              end
      if color == :red
        "<td class=\"text-right\" style=\"color:#F00\">#{inner}</td>".html_safe
      elsif color == :green
        "<td class=\"text-right\" style=\"color:#1CB71C\">#{inner}</td>".html_safe
      else
        "<td class=\"text-right\">#{inner}</td>".html_safe
      end
    end
  end

  RedNumberTd = Struct.new(:value) do
    def render
      "<td class=\"text-right text-danger\">#{value}</td>".html_safe
    end
  end

  RightTh = Struct.new(:value) do
    def render
      "<th class=\"text-right\">#{value}</th>".html_safe
    end
  end

  LeftTh = Struct.new(:value) do
    def render
      "<th>#{value}</th>".html_safe
    end
  end

  class EmptyTh
    def render
      "<th></th>".html_safe
    end
  end

  DateRangeTd = Struct.new(:date_range) do
    def render
      from_time = date_range.first.strftime("%b %Y")
      end_time = if date_range.last.nil?
                   "<strong>ongoing...</strong>"
                 else
                   date_range.last.strftime("%b %Y")
                 end
      "<td>#{from_time} - #{end_time}</td>".html_safe
    end
  end

  def self.all
    q = -> (query) { ActiveRecord::Base.connection.execute(query) }
    [ Statistics::BestMedalCollection.new(q),
      Statistics::SumOfRanks.new(q, %w(333 444 555),
                                 name: "Sum of 3x3/4x4/5x5 ranks",
                                 subtitle: "Single and Average",
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
      Statistics::MostSubXSolves.new(q, [10, 9, 8, 7, 6]),
      Statistics::BlindfoldedSuccessStreak.new(q),
      Statistics::BlindfoldedRecentSuccessRate.new(q),
      Statistics::MostWorldRecords.new(q),
      Statistics::BestPodiums.new(q),
      Statistics::MostCompetitions.new(q),
      Statistics::MostCountries.new(q),
      Statistics::MostSolvesInOneCompetitionOrYear.new(q),
    ]
  end
end
