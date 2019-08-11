# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "results" do
  describe "GET #rankings" do
    context "with valid params" do
      it "shows rankings" do
        get results_rankings_path("333", "single")
        expect(response).to be_successful
      end
    end

    context "with missing params" do
      it "defaults to 333 ranking" do
        get "/new-results/rankings"
        expect(response).to redirect_to(results_rankings_path("333", "single"))
      end

      it "defaults to single ranking" do
        get "/new-results/rankings/pyram"
        expect(response).to redirect_to(results_rankings_path("pyram", "single"))
      end

      it "redirects 333mbf average to single ranking" do
        get results_rankings_path("333mbf", "average")
        expect(response).to redirect_to(results_rankings_path("333mbf", "single"))
      end
    end
  end
end
