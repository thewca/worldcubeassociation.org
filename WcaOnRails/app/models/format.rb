# frozen_string_literal: true
class Format
  attr_accessor :id, :name, :sort_by, :trim_fastest_n, :trim_slowest_n, :expected_solve_count

  def initialize(id:, name:, sort_by:, trim_fastest_n: 0, trim_slowest_n: 0, expected_solve_count:)
    @id = id
    @name = name
    @sort_by = sort_by
    @expected_solve_count = expected_solve_count
    @trim_fastest_n = trim_fastest_n
    @trim_slowest_n = trim_slowest_n
  end

  def to_partial_path
    "format"
  end

  def sort_by_second
    case @sort_by
    when :average
      :single
    when :single
      :average
    else
      fail "Unrecognized sort_by: #{@sort_by}"
    end
  end

  def self.find(id)
    ALL_FORMATS_BY_ID[id] or fail "Unrecognized event id"
  end

  def self.find_by_id(id)
    ALL_FORMATS_BY_ID[id] || Format.new(id: id, name: "Invalid", cellName: "Invalid", rank: 0, valid: false)
  end

  def self.all
    ALL_FORMATS
  end

  def hash
    id.hash
  end

  def eql?(other)
    id == other.id
  end

  ALL_FORMATS = [
    {
      id: "1",
      name: "Best of 1",
      sort_by: :single,
      expected_solve_count: 1,
    },
    {
      id: "2",
      name: "Best of 2",
      sort_by: :single,
      expected_solve_count: 2,
    },
    {
      id: "3",
      name: "Best of 3",
      sort_by: :single,
      expected_solve_count: 3,
    },
    {
      id: "a",
      name: "Average of 5",
      sort_by: :average,
      expected_solve_count: 5,
      trim_fastest_n: 1,
      trim_slowest_n: 1,
    },
    {
      id: "m",
      name: "Mean of 3",
      sort_by: :average,
      expected_solve_count: 3,
    },
  ].map { |e| Format.new(e) }

  ALL_FORMATS_BY_ID = Hash[ALL_FORMATS.map { |e| [e.id, e] }]
end
