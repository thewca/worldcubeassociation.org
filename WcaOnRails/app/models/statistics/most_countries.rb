module Statistics
  class MostCountries < AbstractStatistic
    def name; "Most Countries"; end
    def info
      "[Person] In how many countries the person participated. " +
      "[Event] In how many countries the event has been offered. " +
      "[Competition] Of how many countries persons participated."
    end
    def id; "most_countries"; end

    def tables
      persons = @q.(<<-SQL
        SELECT personId, personName, COUNT(DISTINCT competitions.countryId) as numberOfCountries
        FROM Results results, Competitions competitions
        WHERE competitions.id = competitionId
        AND   competitions.countryId NOT REGEXP '^X[A-Z]{1}$'
        GROUP BY personId
        ORDER BY numberOfCountries DESC, personName
        LIMIT 10
        SQL
      ).map do |row|
        [PersonTd.new(row[0], row[1]), BoldNumberTd.new(row[2])]
      end

      events = @q.(<<-SQL
        SELECT eventId, COUNT(DISTINCT competitions.countryId) as numberOfCountries
        FROM Results, Competitions competitions
        WHERE competitions.id = competitionId
        AND   competitions.countryId NOT REGEXP '^X[A-Z]{1}$'
        GROUP BY eventId
        ORDER BY numberOfCountries DESC, eventId
        LIMIT 10
        SQL
      ).map do |row|
        e = Event.find(row[0])
        [EventTd.new(e.id, e.name), BoldNumberTd.new(row[1])]
      end

      competitions = @q.(<<-SQL
        SELECT   results.competitionId, competitions.cellName, COUNT(DISTINCT(results.countryId)) AS numberOfCountries
        FROM     Results results, Competitions competitions
        WHERE    results.countryId NOT REGEXP '^X[A-Z]{1}$'
        AND      results.competitionId = competitions.id
        GROUP BY results.competitionId
        ORDER BY numberOfCountries DESC, results.competitionId
        LIMIT 10
        SQL
      ).map do |row|
        [CompetitionTd.new(row[0], row[1]), BoldNumberTd.new(row[2])]
      end
      persons_header = [LeftTh.new('Person'), RightTh.new('Countries')]
      events_header = [LeftTh.new('Event'), RightTh.new('Countries')]
      countries_header = [LeftTh.new('Competition'), RightTh.new('Countires')]

      [ Table.new(persons_header, persons),
        Table.new(events_header, events),
        Table.new(countries_header, competitions)
      ]
    end
  end
end
