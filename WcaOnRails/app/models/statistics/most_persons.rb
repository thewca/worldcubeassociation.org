module Statistics
  class MostPersons < AbstractStatistic
    def name; "Most Persons"; end
    def info
      "[Event] How many persons participated in the event. " +
      "[Competition] How many persons participated in the competition. " +
      "[Country] How many citizens of this country participated. "
    end
    def id; "most_persons"; end

    def tables
      events = @q.(<<-SQL
        SELECT eventId, COUNT(DISTINCT personId) as numberOfPersons
        FROM Results
        GROUP BY eventId
        ORDER BY numberOfPersons DESC, eventId
        LIMIT 10
        SQL
      ).map do |row|
        e = Event.find(row[0])
        [EventTd.new(e.id, e.name), BoldNumberTd.new(row[1])]
      end

      competitions = @q.(<<-SQL
        SELECT competitionId, c.cellName, COUNT(DISTINCT personId) as numberOfPersons
        FROM Results, Competitions c
        WHERE Results.competitionId = c.id
        GROUP BY competitionId
        ORDER BY numberOfPersons DESC, competitionId
        LIMIT 10
        SQL
      ).map do |row|
        [CompetitionTd.new(row[0], row[1]), BoldNumberTd.new(row[2])]
      end

      countries = @q.(<<-SQL
        SELECT   countryId, COUNT(DISTINCT personId) AS numberOfPersons
        FROM     Results
        GROUP BY countryId
        ORDER BY numberOfPersons DESC, countryId
        LIMIT 10
        SQL
      ).map do |row|
        c = Country.find(row[0])
        [CountryTd.new(c.id, c.name), BoldNumberTd.new(row[1])]
      end
      events_header = [LeftTh.new('Event'), RightTh.new('Persons')]
      competitions_header = [LeftTh.new('Competition'), RightTh.new('Persons')]
      countries_header = [LeftTh.new('Country'), RightTh.new('Persons')]

      [ Table.new(events_header, events),
        Table.new(competitions_header, competitions),
        Table.new(countries_header, countries)
      ]
    end
  end
end
