# frozen_string_literal: true

require 'rails_helper'

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

    it "does not allow extra commas" do
      model.city = "New York, New York, foo bar"
      expect(model).to be_invalid_with_errors city: ["New York, foo bar is not a valid state"]
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

    it "requires city, county" do
      model.city = "Birmingham, West Midlands"
      expect(model).to be_valid

      model.city = "Birmingham, Midlands"
      expect(model).to be_invalid_with_errors city: ["Midlands is not a valid county"]

      model.city = "Dieppe"
      expect(model).to be_invalid_with_errors city: ["is not of the form 'city, county'"]
    end
  end

  context "AR" do
    let(:country) { Country.find_by_iso2!("AR") }
    let(:model) { TestModel.new(country: country) }

    it "requires city, province" do
      model.city = "La Plata, Buenos Aires"
      expect(model).to be_valid

      model.city = "La Plata, BA"
      expect(model).to be_invalid_with_errors city: ["BA is not a valid province"]

      model.city = "La Plata"
      expect(model).to be_invalid_with_errors city: ["is not of the form 'city, province'"]
    end
  end

  context "AU" do
    let(:country) { Country.find_by_iso2!("AU") }
    let(:model) { TestModel.new(country: country) }

    it "requires city, state or territory" do
      model.city = "Darwin, Northern Territory"
      expect(model).to be_valid

      model.city = "Darwin, NT"
      expect(model).to be_invalid_with_errors city: ["NT is not a valid state or territory"]

      model.city = "Darwin"
      expect(model).to be_invalid_with_errors city: ["is not of the form 'city, state or territory'"]
    end
  end

  context "IN" do
    let(:country) { Country.find_by_iso2!("IN") }
    let(:model) { TestModel.new(country: country) }

    it "requires city, state" do
      model.city = "Mumbai, Maharashtra"
      expect(model).to be_valid

      model.city = "Mumbai, Maharasthra"
      expect(model).to be_invalid_with_errors city: ["Maharasthra is not a valid state"]

      model.city = "Mumbai"
      expect(model).to be_invalid_with_errors city: ["is not of the form 'city, state'"]
    end
  end

  context "BR" do
    let(:country) { Country.find_by_iso2!("BR") }
    let(:model) { TestModel.new(country: country) }

    it "requires city, state" do
      model.city = "Brasília, Distrito Federal"
      expect(model).to be_valid

      model.city = "Brasília, DF"
      expect(model).to be_invalid_with_errors city: ["DF is not a valid state"]

      model.city = "Brasília"
      expect(model).to be_invalid_with_errors city: ["is not of the form 'city, state'"]
    end
  end

  context "FR" do
    let(:country) { Country.find_by_iso2!("FR") }
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
