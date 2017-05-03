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
              name: view_context.link_to(person.name, person_path(person.wca_id)),
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
    @person = Person.current.includes(:user, :ranksSingle, :ranksAverage, :competitions).find_by_wca_id!(params[:id])
    @previous_persons = Person.where(wca_id: params[:id]).where.not(subId: 1).order(:subId)
    @ranks_single = @person.ranksSingle
    @ranks_average = @person.ranksAverage
    @medals = @person.medals
    @records = @person.records
    @results = @person.results.includes(:competition, :event, :format, :round_type).order("Events.rank, Competitions.start_date DESC, RoundTypes.rank DESC")
    @world_championship_podiums = @person.world_championship_podiums
    params[:event] ||= @results.first.event.id
  end
end
