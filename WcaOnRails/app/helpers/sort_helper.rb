# frozen_string_literal: true

module SortHelper
  # The value of sort_param should be of the format inspired from https://specs.openstack.org/openstack/api-wg/guidelines/pagination_filter_sort.html.
  # Example: "name:asc,age:desc" or if order is not needed, "name,age" which will take ascending by default.
  def sort(array, sort_param, sort_weight_lambdas)
    # sort_keys_and_directions is an array of strings of the format "name:asc" or "age:desc".
    sort_keys_and_directions = sort_param.split(',')
    # Convert the array to an array of arrays with index. The index will be used to break ties, and hence promising a stable sort.
    array_with_index = array.map.with_index { |e, i| [e, i] }

    # Sort the array based on the sort_keys_and_directions.
    sorted_array_with_index = array_with_index.sort do |a, b|
      a_value = a[0]
      a_index = a[1]
      b_value = b[0]
      b_index = b[1]
      # first_in_order will be nil if the two elements are equal based on the current sort_key.
      first_in_order = nil

      sort_keys_and_directions.each do |sort_key_and_direction|
        sort_key, direction = sort_key_and_direction.split(':')
        direction ||= 'asc'
        # sort_weight_lambda is a lambda that takes an element and returns the weight of the element based on the sort_key.
        sort_weight_lambda = sort_weight_lambdas[sort_key.to_sym]

        raise "Invalid sort_key: #{sort_key}" if sort_weight_lambda.nil?
        raise "Invalid sort_direction: #{direction}" unless %w[asc desc].include?(direction)

        a_value_for_sort = sort_weight_lambda.call(a_value)
        b_value_for_sort = sort_weight_lambda.call(b_value)

        # If the values are not equal, then we have found the first_in_order. We will break the loop and return the first_in_order.
        if a_value_for_sort != b_value_for_sort
          first_in_order = a_value_for_sort <=> b_value_for_sort
          if direction == 'desc'
            first_in_order = -first_in_order
          end
          break
        end
      end
      # If first_in_order is nil, then we will compare the indices of the elements to break the tie.
      if first_in_order.nil?
        a_index <=> b_index
      else
        first_in_order
      end
    end

    # Return the sorted array after removing the indices.
    sorted_array_with_index.map { |e| e[0] }
  end
end
