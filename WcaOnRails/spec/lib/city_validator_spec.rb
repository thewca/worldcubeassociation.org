# frozen_string_literal: true

require 'rails_helper'
require 'relations'

RSpec.describe CityValidator do
  context "US" do
    let(:country) { Country.find_by_iso2!("US") }
    let(:model) { TestModel.new(country: country) }

    it "requires city, state" do
      model.city = "New York, New York"
      expect(model).to be_valid

      model.city = "New York, NY"
      expect(model).to be_invalid_with_errors city: ["NY is not a valid state"]

      model.city = "New York"
      expect(model).to be_invalid_with_errors city: ["is not of the form 'city, state'"]
    end

    it "allows multiple cities" do
      model.city = "Multiple cities"
      expect(model).to be_valid
    end
  end

  context "CA" do
    let(:country) { Country.find_by_iso2!("CA") }
    let(:model) { TestModel.new(country: country) }

    it "requires city, province" do
      model.city = "Dieppe, New Brunswick"
      expect(model).to be_valid

      model.city = "Dieppe, NB"
      expect(model).to be_invalid_with_errors city: ["NB is not a valid province"]

      model.city = "Dieppe"
      expect(model).to be_invalid_with_errors city: ["is not of the form 'city, province'"]
    end
  end

  context "GB" do
    let(:country) { Country.find_by_iso2!("GB") }
    let(:model) { TestModel.new(country: country) }

    it "anything goes" do
      model.city = "Anything Goes?"
      expect(model).to be_valid
    end
  end
end

class TestModel
  include ActiveModel::Model

  attr_accessor :city
  validates :city, city: true

  attr_accessor :country
end
