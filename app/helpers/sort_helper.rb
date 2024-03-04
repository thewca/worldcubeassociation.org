# frozen_string_literal: true

module SortHelper
  # The value of sort_param should be of the format inspired from https://specs.openstack.org/openstack/api-wg/guidelines/pagination_filter_sort.html.
  # Example: "name:asc,age:desc" or if direction is not relevant, "name,age" which will take ascending by default.
  def sort(array, sort_param, sort_weight_lambdas)
    # sort_keys_and_directions is an array of strings of the format "name:asc" or "age:desc".
    sort_keys_and_directions = sort_param.split(',')

    # Sort the array based on the sort_keys_and_directions.
    # It is critical that we reverse the sorting order, i.e. we sort by least important param first
    sort_keys_and_directions.reverse.reduce(array) do |memo, sort_key_and_direction|
      sort_key, direction = sort_key_and_direction.split(':')
      direction ||= 'asc'

      # sort_weight_lambda is a lambda that takes an element and returns the weight of the element based on the sort_key.
      sort_weight_lambda = sort_weight_lambdas[sort_key.to_sym]

      raise "Invalid sort_key: #{sort_key}" if sort_weight_lambda.nil?
      raise "Invalid sort_direction: #{direction}" unless %w[asc desc].include?(direction)

      # We need to use a sort that guarantees the results to be stable, because our list might have
      # already been sorted by less important keys (tie-breakers) and we need to preserve that order.
      self.stable_sort_by memo, direction, &sort_weight_lambda
    end
  end

  private def stable_sort_by(array, direction, &)
    direction == 'asc' ? array.stable_sort_by_asc(&) : array.stable_sort_by_desc(&)
  end
end
