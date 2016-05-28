class PersonsController < ApplicationController
  def index
    @regions = { 'Continent' => Continent.all.map { |continent| [continent.name, continent.id] },
                 'Country' => Country.all.map { |country| [country.name, country.id] } }

    params[:region] ||= "all"

    respond_to do |format|
      format.html
      format.js do
        persons = Person.joins("JOIN Countries ON countryId = Countries.id")
        if params[:region] != "all"
          persons = persons.where("countryId = :region OR continentId = :region", region: params[:region])
        end
        if params[:search].present?
          persons = persons.where("rails_persons.name LIKE :input OR wca_id LIKE :input", input: "%#{params[:search]}%")
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
              podiums_count: person.results.where(roundId: [:f, :c], pos: [1, 2, 3]).where('best > 0').count,
            }
          end,
        }
      end
    end
  end
end
