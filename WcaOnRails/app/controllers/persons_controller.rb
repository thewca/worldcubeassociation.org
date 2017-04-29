# frozen_string_literal: true

class PersonsController < ApplicationController
  def index
    respond_to do |format|
      format.html
      format.js do
        persons = Person.in_region(params[:region]).order(:name)
        params[:search]&.split&.each do |part|
          persons = persons.where("rails_persons.name LIKE :part OR wca_id LIKE :part", part: "%#{part}%")
        end

        render json: {
          total: persons.count,
          rows: persons.limit(params[:limit]).offset(params[:offset]).map do |person|
            {
              name: view_context.link_to(person.name, "/results/p.php?i=#{person.wca_id}"),
              wca_id: person.wca_id,
              country: person.country.name,
              competitions_count: person.competitions.count,
              podiums_count: person.results.podium.count,
            }
          end,
        }
      end
    end
  end

  def show
    @person = Person.current.includes(:user, :ranksSingle, :ranksAverage, :competitions).find_by_wca_id(params[:id])
    @ranks_single = @person.ranksSingle
    @ranks_average = @person.ranksAverage
    @events_competed_in = Event.where(id: (@ranks_single.map(&:eventId) + @ranks_average.map(&:eventId)).uniq)
    @world_championship_podiums = @person.world_championship_podiums
    @medals = @person.medals
    @records = @person.records
    @results = @person.results.includes(:competition, :event, :format, :round_type).order("Events.rank, Competitions.start_date DESC, RoundTypes.rank DESC")
    params[:results_event] ||= @results.first.event.id
  end
end
