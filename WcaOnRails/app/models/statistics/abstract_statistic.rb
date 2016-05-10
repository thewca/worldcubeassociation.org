module Statistics
  class AbstractStatistic
    def initialize(q)
      @q = q
    end

    def name
      raise NotImplementedError.new("A statistic needs a name")
    end

    def subtitle
      nil
    end

    def info
      nil
    end

    def id
      raise NotImplementedError.new("A statistic needs an id")
    end

    def tables
      raise NotImplementedError.new("A statistic needs tables")
    end
  end
end
