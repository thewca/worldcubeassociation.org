class StatisticsController < ApplicationController
  layout "php_land"

  PersonTd = Struct.new(:id, :name) do
    include ActionView::Helpers::FormHelper
    include PathHelper

    def render
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

  SpacerTd = Struct.new(:value) do
    def render
      "<td class=\"L\"> &nbsp; &nbsp; | &nbsp; &nbsp; </td>".html_safe
    end
  end

  NumberTd = Struct.new(:value) do
    def render
      "<td class=\"R2\">#{value}</td>".html_safe
    end
  end

  module Statistic
    class MostCompetitions
      def title; "Most Competitions"; end
      def id; "most_competitions"; end

      def rows
        q = -> (query) { ActiveRecord::Base.connection.execute(query) }
        persons = q.(<<-SQL
          SELECT personId, name, COUNT(DISTINCT competitionId) as numberOfCompetitions
          FROM Results
          LEFT JOIN Persons ON Results.personId = Persons.id
          GROUP BY personId
          ORDER BY numberOfCompetitions DESC, personId
          LIMIT 10
          SQL
        ).map do |row|
          [PersonTd.new(row[0], row[1]), NumberTd.new(row[2])]
        end

        events = q.(<<-SQL
          SELECT eventId, COUNT(DISTINCT competitionId) as numberOfCompetitions
          FROM Results
          GROUP BY eventId
          ORDER BY numberOfCompetitions DESC, eventId
          LIMIT 10
          SQL
        ).map do |row|
          e = Event.find(row[0])
          [EventTd.new(e.id, e.name), NumberTd.new(row[1])]
        end

        countries = q.(<<-SQL
          SELECT   countryId, Countries.name, COUNT(*) as numberOfCompetitions
          FROM     Competitions
          LEFT JOIN Countries ON Competitions.countryId = Countries.id
          WHERE    showAtAll
            AND    datediff(year * 10000 + month*100+day, curdate()) < 0
          GROUP BY countryId
          ORDER BY numberOfCompetitions DESC, countryId
          LIMIT 10
          SQL
        ).map do |row|
          [CountryTd.new(row[0], row[1]), NumberTd.new(row[2])]
        end

        persons.zip(events, countries).map do |args|
          empty = [EmptyTd.new] * 2
          args.map { |e| e || empty }.inject([]) { |a, v| a + v + [SpacerTd.new] }[0...-1]
        end
      end
    end
  end

  class Statistics
    def self.all
      [
        Statistic::MostCompetitions.new
      ]
    end
  end

  def index
    @statistics = Statistics.all
  end
end
