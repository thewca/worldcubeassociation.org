# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "results" do
  describe "GET #rankings" do
    context "with valid params" do
      it "shows rankings" do
        get rankings_path("333", "single")
        expect(response).to be_successful
      end
    end

    context "with missing params" do
      it "defaults to 333 ranking" do
        get "/results/rankings"
        expect(response).to redirect_to(rankings_path("333", "single"))
      end

      it "defaults to single ranking" do
        get "/results/rankings/pyram"
        expect(response).to redirect_to(rankings_path("pyram", "single"))
      end

      it "redirects 333mbf average to single ranking" do
        get rankings_path("333mbf", "average")
        expect(response).to redirect_to(rankings_path("333mbf", "single"))
      end
    end
  end

  describe "GET #records" do
    context 'html request format' do
      it "show records given default params" do
        get records_path
        expect(response).to be_successful
      end
    end

    context 'json' do
      let(:headers) { { 'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json' } }
      let(:genders) { %w[Male Female] }

      RSpec.shared_examples 'single parameter' do |param_name, param_value|
        it "returns success for param #{param_name} with value: #{param_value}" do
          get records_path, headers: headers, params: { **{ param_name => param_value } }
          expect(response).to be_successful
        end
      end

      ResultsController::SHOWS.each do |show|
        it_behaves_like 'single parameter', 'show', show
      end

      ResultsController::GENDERS.each do |gender|
        it_behaves_like 'single parameter', 'gender', gender
      end

      TestConstants::RESULT_TEST_EVENTS.each do |event|
        it_behaves_like 'single parameter', 'event_id', event
      end

      TestConstants::RESULT_TEST_REGIONS.each do |region|
        it_behaves_like 'single parameter', 'region', region
      end

      RSpec.shared_examples 'two parameters' do |param_1, param_2, value_1, value_2|
        it "returns success for params #{param_1}/#{param_2} with values: #{value_1}/#{value_2}" do
          get records_path, headers: headers, params: { ** { param_1 => value_1, param_2 => value_2 } }
          expect(response).to be_successful
        end
      end

      ResultsController::SHOWS.each do |show|
        TestConstants::RESULT_TEST_REGIONS.each do |region|
          it_behaves_like 'two parameters', 'show', 'region', show, region
        end
      end
    end
  end
end
