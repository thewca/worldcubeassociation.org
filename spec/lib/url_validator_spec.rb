# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UrlValidator do
  it "validates urls" do
    valid_urls = [
      'http://www.google.com',
      'https://www.google.com',
    ]
    invalid_urls = [
      'https://',
      'http://',
      'http://www.google.com ',
      ' http://www.google.com',
      'http://www. google.com',
      'foo.com',
      "bar",
    ]

    valid_urls.each do |valid_url|
      model = TestModel.new(url: valid_url)
      expect(model).to be_valid
    end

    invalid_urls.each do |invalid_url|
      model = TestModel.new(url: invalid_url)
      expect(model).to be_invalid_with_errors url: ["must be a valid url starting with http:// or https://"]
    end
  end
end

class TestModel
  include ActiveModel::Model

  attr_accessor :url
  validates :url, url: true
end
