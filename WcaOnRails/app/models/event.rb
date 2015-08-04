class Event
  attr_accessor :id, :name, :rank, :format, :cellName, :valid
  alias_method :valid?, :valid

  def initialize(attributes={})
    @id = attributes[:id]
    @name = attributes[:name]
    @rank = attributes[:rank]
    @format = attributes[:format]
    @cellName = attributes[:cellName]
    @valid = attributes[:valid]
  end

  def to_partial_path
    "event"
  end

  def self.find(id)
    ALL_EVENTS_BY_ID[id] or throw "Unrecognized event id"
  end

  def self.find_by_id(id)
    ALL_EVENTS_BY_ID[id] || Event.new(id: id, name: "Invalid", cellName: "Invalid", rank: 0, valid: false)
  end

  def self.all
    ALL_EVENTS
  end

  def official?
    valid? && rank < 990
  end

  def deprecated?
    valid? && 990 <= rank && rank < 1000
  end

  def never_was_official?
    valid? && rank >= 1000
  end

  # See https://github.com/cubing/worldcubeassociation.org/issues/96
  # for where these ranks come from.
  def self.all_official
    Event.all.select &:official?
  end

  def self.all_deprecated
    Event.all.select &:deprecated?
  end

  def self.all_never_were_official
    Event.all.select &:never_was_official?
  end

  def hash
    id.hash
  end

  def eql?(o)
    id == o.id
  end

  ALL_EVENTS = [
    {
      id: "333",
      name: "Rubik's Cube",
      rank: 10,
      format: "time",
      cellName: "Rubik's Cube",
    },
    {
      id: "444",
      name: "4x4 Cube",
      rank: 20,
      format: "time",
      cellName: "4x4 Cube",
    },
    {
      id: "555",
      name: "5x5 Cube",
      rank: 30,
      format: "time",
      cellName: "5x5 Cube",
    },
    {
      id: "222",
      name: "2x2 Cube",
      rank: 40,
      format: "time",
      cellName: "2x2 Cube",
    },
    {
      id: "333bf",
      name: "Rubik's Cube: Blindfolded",
      rank: 50,
      format: "time",
      cellName: "3x3 blindfolded",
    },
    {
      id: "333oh",
      name: "Rubik's Cube: One-handed",
      rank: 60,
      format: "time",
      cellName: "3x3 one-handed",
    },
    {
      id: "333fm",
      name: "Rubik's Cube: Fewest moves",
      rank: 70,
      format: "number",
      cellName: "3x3 fewest moves",
    },
    {
      id: "333ft",
      name: "Rubik's Cube: With feet",
      rank: 80,
      format: "time",
      cellName: "3x3 with feet",
    },
    {
      id: "minx",
      name: "Megaminx",
      rank: 110,
      format: "time",
      cellName: "Megaminx",
    },
    {
      id: "pyram",
      name: "Pyraminx",
      rank: 120,
      format: "time",
      cellName: "Pyraminx",
    },
    {
      id: "sq1",
      name: "Square-1",
      rank: 130,
      format: "time",
      cellName: "Square-1",
    },
    {
      id: "clock",
      name: "Rubik's Clock",
      rank: 140,
      format: "time",
      cellName: "Rubik's Clock",
    },
    {
      id: "skewb",
      name: "Skewb",
      rank: 150,
      format: "time",
      cellName: "Skewb",
    },
    {
      id: "666",
      name: "6x6 Cube",
      rank: 200,
      format: "time",
      cellName: "6x6 Cube",
    },
    {
      id: "777",
      name: "7x7 Cube",
      rank: 210,
      format: "time",
      cellName: "7x7 Cube",
    },
    {
      id: "444bf",
      name: "4x4 Cube: Blindfolded",
      rank: 500,
      format: "time",
      cellName: "4x4 blindfolded",
    },
    {
      id: "555bf",
      name: "5x5 Cube: Blindfolded",
      rank: 510,
      format: "time",
      cellName: "5x5 blindfolded",
    },
    {
      id: "333mbf",
      name: "Rubik's Cube: Multiple Blindfolded",
      rank: 520,
      format: "multi",
      cellName: "3x3 multi blind",
    },
    {
      id: "magic",
      name: "Rubik's Magic",
      rank: 997,
      format: "time",
      cellName: "Rubik's Magic",
    },
    {
      id: "mmagic",
      name: "Master Magic",
      rank: 998,
      format: "time",
      cellName: "Master Magic",
    },
    {
      id: "333mbo",
      name: "Rubik's Cube: Multi blind old style",
      rank: 999,
      format: "multi",
      cellName: "3x3 multi blind old",
    },
    {
      id: "333ni",
      name: "Rubik's Cube: No inspection",
      rank: 1010,
      format: "time",
      cellName: "3x3 no inspection",
    },
    {
      id: "333sbf",
      name: "Rubik's Cube: Speed Blindfolded",
      rank: 1020,
      format: "time",
      cellName: "3x3 speed blindfolded",
    },
    {
      id: "333r3",
      name: "Rubik's Cube: 3 in a row",
      rank: 1030,
      format: "time",
      cellName: "3x3 3 in a row",
    },
    {
      id: "333ts",
      name: "Rubik's Cube: Team solving",
      rank: 1035,
      format: "time",
      cellName: "3x3 team solving",
    },
    {
      id: "333bts",
      name: "Rubik's Cube: Blindfolded team solving",
      rank: 1040,
      format: "time",
      cellName: "3x3 blindfolded team solving",
    },
    {
      id: "222bf",
      name: "2x2 Cube: Blindfolded",
      rank: 1050,
      format: "time",
      cellName: "2x2 blindfolded",
    },
    {
      id: "clkbf",
      name: "Rubik's Clock: Blindfolded",
      rank: 1060,
      format: "time",
      cellName: "Clock blindfolded",
    },
    {
      id: "333si",
      name: "Siamese Rubik's Cube",
      rank: 1100,
      format: "time",
      cellName: "Siamese Cube",
    },
    {
      id: "rainb",
      name: "Rainbow Cube",
      rank: 1110,
      format: "time",
      cellName: "Rainbow Cube",
    },
    {
      id: "snake",
      name: "Rubik's Snake",
      rank: 1120,
      format: "time",
      cellName: "Rubik's Snake",
    },
    {
      id: "mirbl",
      name: "Mirror Blocks",
      rank: 1140,
      format: "time",
      cellName: "Mirror Blocks",
    },
    {
      id: "360",
      name: "Rubik's 360",
      rank: 1150,
      format: "time",
      cellName: "Rubik's 360",
    },
    {
      id: "222oh",
      name: "2x2 Cube: One-handed",
      rank: 1200,
      format: "time",
      cellName: "2x2 one-handed",
    },
    {
      id: "magico",
      name: "Rubik's Magic: One-handed",
      rank: 1210,
      format: "time",
      cellName: "Magic one-handed",
    }
  ].map { |e| Event.new(e.merge(valid: true)) }

  ALL_EVENTS_BY_ID = Hash[ALL_EVENTS.map { |e| [e.id, e] }]
end
