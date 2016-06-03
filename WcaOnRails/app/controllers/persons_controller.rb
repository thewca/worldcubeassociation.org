class PersonsController < ApplicationController
  def index
    params[:region] ||= "all"

    respond_to do |format|
      format.html
      format.js do
        persons = Person.joins("JOIN Countries ON countryId = Countries.id")
        if params[:region] != "all"
          persons = persons.where("countryId = :region OR continentId = :region", region: params[:region])
        end
        if params[:search].present?
          params[:search].split.each do |part|
            persons = persons.where("rails_persons.name LIKE :part OR wca_id LIKE :part", part: "%#{part}%")
          end
        end
        persons = persons.order(:name, :countryId)

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
