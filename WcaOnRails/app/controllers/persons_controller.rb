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
end
