class Continent
  attr_accessor :id, :name, :recordName, :latitude, :longitude, :zoom

  def initialize(attributes={})
    @id = attributes[:id]
    @name = attributes[:name]
    @recordName = attributes[:continentId]
    @latitude = attributes[:latitude]
    @longitude = attributes[:longitude]
    @zoom = attributes[:zoom]
  end

  def to_partial_path
    "continent"
  end

  def self.find(id)
    ALL_CONTINENTS_BY_ID[id] || fail("Unrecognized continent id")
  end

  def self.find_by_id(id)
    ALL_CONTINENTS_BY_ID[id]
  end

  def self.all
    ALL_CONTINENTS
  end

  def hash
    id.hash
  end

  def eql?(other)
    id == other.id
  end

  ALL_CONTINENTS = [
    {
      "id": "_Africa",
      "name": "Africa",
      "recordName": "AfR",
      "latitude": 213671,
      "longitude": 16984850,
      "zoom": 3,
    },
    {
      "id": "_Asia",
      "name": "Asia",
      "recordName": "AsR",
      "latitude": 34364439,
      "longitude": 108330700,
      "zoom": 2,
    },
    {
      "id": "_Europe",
      "name": "Europe",
      "recordName": "ER",
      "latitude": 58299984,
      "longitude": 23049300,
      "zoom": 3,
    },
    {
      "id": "_North America",
      "name": "North America",
      "recordName": "NAR",
      "latitude": 45486546,
      "longitude": -93449700,
      "zoom": 3,
    },
    {
      "id": "_Oceania",
      "name": "Oceania",
      "recordName": "OcR",
      "latitude": -25274398,
      "longitude": 133775136,
      "zoom": 3,
    },
    {
      "id": "_South America",
      "name": "South America",
      "recordName": "SAR",
      "latitude": -21735104,
      "longitude": -63281250,
      "zoom": 3,
    },
  ].map { |e| Continent.new(e) }

  ALL_CONTINENTS_BY_ID = Hash[ALL_CONTINENTS.map { |e| [e.id, e] }]
  ALL_CONTINENTS_WITH_NAME_AND_ID = Continent.all.map { |continent| [continent.name, continent.id] }
end
