class Round
  attr_accessor :id, :rank, :name, :cellName, :valid
  alias_method :valid?, :valid

  @@all = []
  @@all_by_id = {}
  def initialize(attributes={})
    @id = attributes[:id]
    @rank = attributes[:rank]
    @name = attributes[:name]
    @cellName = attributes[:cellName]
    @valid = attributes[:valid]
    if @valid
      @@all << self
      @@all_by_id[self.id] = self
    end
  end

  def self.find(id)
    @@all_by_id[id] or raise "Unrecognized round id"
  end

  def self.find_by_id(id)
    @@all_by_id[id] || Round.new(id: id, rank: 0, name: "Invalid", cellName: "Invalid", valid: false)
  end

  def self.all
    @@all
  end

  [
    {
      id: 'h',
      rank: 10,
      name: 'Combined qualification',
      cellName: 'Combined qualification',
    },
    {
      id: '0',
      rank: 19,
      name: 'Qualification round',
      cellName: 'Qualification',
    },
    {
      id: 'd',
      rank: 20,
      name: 'Combined First round',
      cellName: 'Combined First',
    },
    {
      id: '1',
      rank: 29,
      name: 'First round',
      cellName: 'First',
    },
    {
      id: 'b',
      rank: 39,
      name: 'B Final',
      cellName: 'B Final',
    },
    {
      id: '2',
      rank: 50,
      name: 'Second round',
      cellName: 'Second',
    },
    {
      id: 'e',
      rank: 59,
      name: 'Combined Second round',
      cellName: 'Combined Second',
    },
    {
      id: 'g',
      rank: 70,
      name: 'Combined Third round',
      cellName: 'Combined Third',
    },
    {
      id: '3',
      rank: 79,
      name: 'Semi Final',
      cellName: 'Semi Final',
    },
    {
      id: 'c',
      rank: 90,
      name: 'Combined Final',
      cellName: 'Combined Final',
    },
    {
      id: 'f',
      rank: 99,
      name: 'Final',
      cellName: 'Final',
    },
  ].each do |round_json|
    round_json[:valid] = true
    Round.new(round_json)
  end
end
