class Table
  attr_reader :header
  attr_reader :rows

  def initialize(header, rows)
    @header, @rows = header, rows
  end
end
