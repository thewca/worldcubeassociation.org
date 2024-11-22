# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WfcController do
  let(:competitions) { FactoryBot.create_list(:competition, 3) }

  context "logged in as WFC member" do
    let!(:wfc_member) { FactoryBot.create :user, :wfc_member }
    before :each do
      sign_in wfc_member
    end

    it "renders a valid export CSV" do
      start_date = competitions.min_by(&:start_date).start_date
      end_date = competitions.max_by(&:end_date).end_date

      post :competition_export, params: { from_date: start_date, to_date: end_date }, as: :csv

      expect(response).to be_successful
      expect(response.headers["Content-Type"]).to eq "text/csv; charset=utf-8"
    end
  end
end
