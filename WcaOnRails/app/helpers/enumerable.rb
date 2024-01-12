# frozen_string_literal: true

module Enumerable
  def stable_sort_by
    sort_by.with_index { |x, idx| [yield(x), idx] }
  end
end
