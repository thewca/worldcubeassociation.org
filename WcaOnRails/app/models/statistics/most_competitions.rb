module Statistics
  class MostCompetitions < AbstractStatistic
    def name; "Most Competitions"; end
    def subtitle; nil; end
    def info
      "[Person] In how many competitions the person participated. " +
      "[Event] In how many competitions the event was included. " +
      "[Country] How many competitions took place in the country."
    end
    def id; "most_competitions"; end

    def tables
      persons = @q.(<<-SQL
        SELECT personId, name, COUNT(DISTINCT competitionId) as numberOfCompetitions
        FROM Results
        LEFT JOIN Persons ON Results.personId = Persons.id
        GROUP BY personId
        ORDER BY numberOfCompetitions DESC, personId
        LIMIT 10
        SQL
      ).map do |row|
        [PersonTd.new(row[0], row[1]), BoldNumberTd.new(row[2])]
      end

      events = @q.(<<-SQL
        SELECT eventId, COUNT(DISTINCT competitionId) as numberOfCompetitions
        FROM Results
        GROUP BY eventId
        ORDER BY numberOfCompetitions DESC, eventId
        LIMIT 10
        SQL
      ).map do |row|
        e = Event.find(row[0])
        [EventTd.new(e.id, e.name), BoldNumberTd.new(row[1])]
      end

      countries = @q.(<<-SQL
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
        [CountryTd.new(row[0], row[1]), BoldNumberTd.new(row[2])]
      end
      persons_header = [LeftTh.new('Person'), RightTh.new('Competitions')]
      events_header = [LeftTh.new('Event'), RightTh.new('Competitions')]
      countries_header = [LeftTh.new('Country'), RightTh.new('Competitions')]

      [ Table.new(persons_header, persons),
        Table.new(events_header, events),
        Table.new(countries_header, countries)
      ]
    end
  end
end
