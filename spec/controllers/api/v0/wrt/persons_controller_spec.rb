# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V0::Wrt::PersonsController do
  describe 'PATCH #update person' do
    before { sign_in create :admin }

    let(:person) { create(:person_who_has_competed_once, name: "Feliks Zemdegs", country_id: "Australia") }

    it "shows a message with link to the check_regional_record_markers script if the person has been fixed and country_id has changed" do
      patch :update, params: { id: person.wca_id, method: "fix", person: {
        wcaId: person.wca_id,
        name: "New Name",
        gender: "o",
        representing: 'NZ',
        dob: "2000-01-01",
      } }
      expect(response).to have_http_status :ok
    end

    it "returns success response when the person has been changed" do
      patch :update, params: { id: person.wca_id, method: "fix", person: {
        wcaId: person.wca_id,
        name: "New Name",
        gender: "o",
        representing: person.country_iso2,
        dob: "2000-01-01",
      } }
      expect(response).to have_http_status :ok
      response_json = response.parsed_body
      expect(response_json['success']).to be true
    end
  end
end
