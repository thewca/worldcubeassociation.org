# frozen_string_literal: true

require "rails_helper"

RSpec.describe SortHelper do
  describe "#sort" do
    let(:array) {
      [
        { name: "a", age: 1 },
        { name: "b", age: 2 },
        { name: "c", age: 4 },
        { name: "d", age: 4 },
        { name: "c", age: 3 },
        { name: "c", age: 5 },
      ]
    }
    let(:sort_weight_lambdas) {
      {
        name: lambda { |e| e[:name] },
        age: lambda { |e| e[:age] },
      }
    }

    it "sorts the array based on just name" do
      sort_param = "name"

      sorted_array = sort(array, sort_param, sort_weight_lambdas)

      expect(sorted_array).to eq(
        [
          { name: "a", age: 1 },
          { name: "b", age: 2 },
          { name: "c", age: 4 },
          { name: "c", age: 3 },
          { name: "c", age: 5 },
          { name: "d", age: 4 },
        ],
      )
    end

    it "sorts the array based on just age" do
      sort_param = "age"

      sorted_array = sort(array, sort_param, sort_weight_lambdas)

      expect(sorted_array).to eq(
        [
          { name: "a", age: 1 },
          { name: "b", age: 2 },
          { name: "c", age: 3 },
          { name: "c", age: 4 },
          { name: "d", age: 4 },
          { name: "c", age: 5 },
        ],
      )
    end

    it "sorts the array based on first name, then age both ascending" do
      sort_param = "name,age"

      sorted_array = sort(array, sort_param, sort_weight_lambdas)

      expect(sorted_array).to eq(
        [
          { name: "a", age: 1 },
          { name: "b", age: 2 },
          { name: "c", age: 3 },
          { name: "c", age: 4 },
          { name: "c", age: 5 },
          { name: "d", age: 4 },
        ],
      )
    end

    it "sorts the array based on first name desc, then age asc" do
      sort_param = "name:desc,age"

      sorted_array = sort(array, sort_param, sort_weight_lambdas)

      expect(sorted_array).to eq(
        [
          { name: "d", age: 4 },
          { name: "c", age: 3 },
          { name: "c", age: 4 },
          { name: "c", age: 5 },
          { name: "b", age: 2 },
          { name: "a", age: 1 },
        ],
      )
    end

    it "sorts the array based on first name asc, then age desc" do
      sort_param = "name:asc,age:desc"

      sorted_array = sort(array, sort_param, sort_weight_lambdas)

      expect(sorted_array).to eq(
        [
          { name: "a", age: 1 },
          { name: "b", age: 2 },
          { name: "c", age: 5 },
          { name: "c", age: 4 },
          { name: "c", age: 3 },
          { name: "d", age: 4 },
        ],
      )
    end

    it "doesn't sort the array if sort_param is empty" do
      sort_param = ""

      sorted_array = sort(array, sort_param, sort_weight_lambdas)

      expect(sorted_array).to eq(
        [
          { name: "a", age: 1 },
          { name: "b", age: 2 },
          { name: "c", age: 4 },
          { name: "d", age: 4 },
          { name: "c", age: 3 },
          { name: "c", age: 5 },
        ],
      )
    end

    it "raises an error if sort_key is invalid" do
      sort_param = "invalid_key"

      expect { sort(array, sort_param, sort_weight_lambdas) }.to raise_error("Invalid sort_key: invalid_key")
    end

    it "raises an error if sort_key is missing" do
      sort_param = ":asc"

      expect { sort(array, sort_param, sort_weight_lambdas) }.to raise_error("Invalid sort_key: ")
    end

    it "raises an error if direction is invalid" do
      sort_param = "name:invalid_direction"

      expect { sort(array, sort_param, sort_weight_lambdas) }.to raise_error("Invalid sort_direction: invalid_direction")
    end

    it "raises an error if sort_param is nil" do
      sort_param = nil

      expect { sort(array, sort_param, sort_weight_lambdas) }.to raise_error(NoMethodError)
    end
  end
end
