class PersonsController < ApplicationController
  def index
    @regions = { 'Continent' => Continent.all.map { |continent| [continent.name, continent.id] },
                 'Country' => Country.all.map { |country| [country.name, country.id] } }
  end
end
