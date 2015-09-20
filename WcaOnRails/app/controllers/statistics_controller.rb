class StatisticsController < ApplicationController
  def index
    @persons = Result.select(:personId, "COUNT(DISTINCT competitionId) as numberOfCompetitions")
                     .group(:personId)
                     .order("numberOfCompetitions DESC, personId")
                     .limit(10).map do |r|
                       p = Person.find(r.personId)
                       OpenStruct.new(id: p.id, name: p.name, count: r.numberOfCompetitions)
                     end
  end
end
