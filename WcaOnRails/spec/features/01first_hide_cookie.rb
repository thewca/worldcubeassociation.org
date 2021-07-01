# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Hide Cookie" do
  context 'Hide Cookie' do
    it 'hides cookies' do
      find(:css, 'body > div.cookies-eu.js-cookies-eu > span.cookies-eu-button-holder > button').click
    end
  end
end
