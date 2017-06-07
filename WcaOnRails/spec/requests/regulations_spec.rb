# frozen_string_literal: true

require "rails_helper"

RSpec.describe "regulations" do
  context 'redirects missing trailing slash' do
    context "without parameters" do
      it 'to trailing slash' do
        get '/regulations/scrambles'
        expect(response).to redirect_to '/regulations/scrambles/'

        follow_redirect!
        expect(response).to be_success
      end
    end

    context "with parameters" do
      it 'to trailing slash' do
        get '/regulations/scrambles?foo=3'
        expect(response).to redirect_to '/regulations/scrambles/?foo=3'

        follow_redirect!
        expect(response).to be_success
      end
    end
  end
end
