# frozen_string_literal: true

class PersonsController < ApplicationController
  def index
    respond_to do |format|
      format.html
      format.json do
        persons = Person.in_region(params[:region]).order(:name)
        params[:search]&.split&.each do |part|
          persons = persons.where("MATCH(Persons.name) AGAINST (:name_match IN BOOLEAN MODE) OR wca_id LIKE :wca_id_part", name_match: "#{part}*", wca_id_part: "#{part}%")
        end

        render json: {
          total: persons.count,
          rows: persons.limit(params[:limit]).offset(params[:offset]).map do |person|
            {
              name: person.name,
              wca_id: person.wca_id,
              country: person.country.iso2,
              competitions_count: person.competitions.count,
              podiums_count: person.results.podium.count,
            }
          end,
        }
      end
    end
  end

  def show
    @person = Person.current.includes(:user, :ranksSingle, :ranksAverage, :competitions).find_by_wca_id!(params[:id])
    @previous_persons = Person.where(wca_id: params[:id]).where.not(subId: 1).order(:subId)
    @ranks_single = @person.ranksSingle.select { |r| r.event.official? }
    @ranks_average = @person.ranksAverage.select { |r| r.event.official? }
    @medals = @person.medals
    @records = @person.records
    @results = @person.results.includes(:competition, :event, :format, :round_type).order("Events.rank, Competitions.start_date DESC, Competitions.id, RoundTypes.rank DESC")
    @championship_podiums = @person.championship_podiums
    params[:event] ||= @results.first.event.id
  end
end
