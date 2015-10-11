class Event
  attr_accessor :id, :name, :rank, :format, :cellName, :valid, :preferred_formats
  alias_method :valid?, :valid

  def initialize(attributes={})
    @id = attributes[:id]
    @name = attributes[:name]
    @rank = attributes[:rank]
    @format = attributes[:format]
    @cellName = attributes[:cellName]
    @valid = attributes[:valid]

    # Maps event codes to an array of allowed formats, in decreasing order of
    # preference. Built from https://www.worldcubeassociation.org/regulations/#9b
    @preferred_formats = attributes[:preferred_format_ids].map { |format_id| Format.find(format_id) }
  end

  def to_partial_path
    "event"
  end

  def self.find(id)
    ALL_EVENTS_BY_ID[id] or raise "Unrecognized event id"
  end

  def self.find_by_id(id)
    ALL_EVENTS_BY_ID[id] || Event.new(id: id, name: "Invalid", cellName: "Invalid", rank: 0, valid: false, preferred_format_ids: [])
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

  def has_average_results?
    !%w(333mbf 444bf 555bf).include?(@id)
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
      preferred_format_ids: %w(a 3 2 1), # https://www.worldcubeassociation.org/regulations/#9b1
    },
    {
      id: "444",
      name: "4x4 Cube",
      rank: 20,
      format: "time",
      cellName: "4x4 Cube",
      preferred_format_ids: %w(a 3 2 1), # https://www.worldcubeassociation.org/regulations/#9b1
    },
    {
      id: "555",
      name: "5x5 Cube",
      rank: 30,
      format: "time",
      cellName: "5x5 Cube",
      preferred_format_ids: %w(a 3 2 1), # https://www.worldcubeassociation.org/regulations/#9b1
    },
    {
      id: "222",
      name: "2x2 Cube",
      rank: 40,
      format: "time",
      cellName: "2x2 Cube",
      preferred_format_ids: %w(a 3 2 1), # https://www.worldcubeassociation.org/regulations/#9b1
    },
    {
      id: "333bf",
      name: "Rubik's Cube: Blindfolded",
      rank: 50,
      format: "time",
      cellName: "3x3 blindfolded",
      preferred_format_ids: %w(3 2 1), # https://www.worldcubeassociation.org/regulations/#9b3
    },
    {
      id: "333oh",
      name: "Rubik's Cube: One-handed",
      rank: 60,
      format: "time",
      cellName: "3x3 one-handed",
      preferred_format_ids: %w(a 3 2 1), # https://www.worldcubeassociation.org/regulations/#9b1
    },
    {
      id: "333fm",
      name: "Rubik's Cube: Fewest moves",
      rank: 70,
      format: "number",
      cellName: "3x3 fewest moves",
      preferred_format_ids: %w(m 2 1), # https://www.worldcubeassociation.org/regulations/#9b2
    },
    {
      id: "333ft",
      name: "Rubik's Cube: With feet",
      rank: 80,
      format: "time",
      cellName: "3x3 with feet",
      preferred_format_ids: %w(m 2 1), # https://www.worldcubeassociation.org/regulations/#9b2
    },
    {
      id: "minx",
      name: "Megaminx",
      rank: 110,
      format: "time",
      cellName: "Megaminx",
      preferred_format_ids: %w(a 3 2 1), # https://www.worldcubeassociation.org/regulations/#9b1
    },
    {
      id: "pyram",
      name: "Pyraminx",
      rank: 120,
      format: "time",
      cellName: "Pyraminx",
      preferred_format_ids: %w(a 3 2 1), # https://www.worldcubeassociation.org/regulations/#9b1
    },
    {
      id: "sq1",
      name: "Square-1",
      rank: 130,
      format: "time",
      cellName: "Square-1",
      preferred_format_ids: %w(a 3 2 1), # https://www.worldcubeassociation.org/regulations/#9b1
    },
    {
      id: "clock",
      name: "Rubik's Clock",
      rank: 140,
      format: "time",
      cellName: "Rubik's Clock",
      preferred_format_ids: %w(a 3 2 1), # https://www.worldcubeassociation.org/regulations/#9b1
    },
    {
      id: "skewb",
      name: "Skewb",
      rank: 150,
      format: "time",
      cellName: "Skewb",
      preferred_format_ids: %w(a 3 2 1), # https://www.worldcubeassociation.org/regulations/#9b1
    },
    {
      id: "666",
      name: "6x6 Cube",
      rank: 200,
      format: "time",
      cellName: "6x6 Cube",
      preferred_format_ids: %w(m 2 1), # https://www.worldcubeassociation.org/regulations/#9b2
    },
    {
      id: "777",
      name: "7x7 Cube",
      rank: 210,
      format: "time",
      cellName: "7x7 Cube",
      preferred_format_ids: %w(m 2 1), # https://www.worldcubeassociation.org/regulations/#9b2
    },
    {
      id: "444bf",
      name: "4x4 Cube: Blindfolded",
      rank: 500,
      format: "time",
      cellName: "4x4 blindfolded",
      preferred_format_ids: %w(3 2 1), # https://www.worldcubeassociation.org/regulations/#9b3
    },
    {
      id: "555bf",
      name: "5x5 Cube: Blindfolded",
      rank: 510,
      format: "time",
      cellName: "5x5 blindfolded",
      preferred_format_ids: %w(3 2 1), # https://www.worldcubeassociation.org/regulations/#9b3
    },
    {
      id: "333mbf",
      name: "Rubik's Cube: Multiple Blindfolded",
      rank: 520,
      format: "multi",
      cellName: "3x3 multi blind",
      preferred_format_ids: %w(3 2 1), # https://www.worldcubeassociation.org/regulations/#9b3
    },

    {
      id: "magic",
      name: "Rubik's Magic",
      rank: 997,
      format: "time",
      cellName: "Rubik's Magic",
      preferred_format_ids: %w(a),
    },
    {
      id: "mmagic",
      name: "Master Magic",
      rank: 998,
      format: "time",
      cellName: "Master Magic",
      preferred_format_ids: %w(a),
    },
    {
      id: "333mbo",
      name: "Rubik's Cube: Multi blind old style",
      rank: 999,
      format: "multi",
      cellName: "3x3 multi blind old",
      preferred_format_ids: %w(a),
    },
  ].map { |e| Event.new(e.merge(valid: true)) }

  ALL_EVENTS_BY_ID = Hash[ALL_EVENTS.map { |e| [e.id, e] }]
end
