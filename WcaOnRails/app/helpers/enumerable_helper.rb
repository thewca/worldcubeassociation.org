# frozen_string_literal: true

module EnumerableHelper
  def stable_sort_by
    sort_by.with_index { |x, idx| [yield(x), idx] }
  end
end
