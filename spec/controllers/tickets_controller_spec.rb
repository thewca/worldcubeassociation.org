# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TicketsController do
  describe "POST #anonymize" do
    sign_in { create(:admin) }

    it 'can anonymize person' do
      person = create(:person_who_has_competed_once)
      wca_id = person.wca_id

      post :anonymize, params: { wcaId: wca_id }

      expect(person.reload.name).to eq User::ANONYMOUS_NAME
      expect(person.reload.wca_id).to include(wca_id.first(4) + 'ANON')
    end

    it 'cannot anonymize banned person' do
      banned_user = create(:user, :banned, :wca_id)
      banned_person = banned_user.person

      post :anonymize, params: { wcaId: banned_person.wca_id }

      expect(response).to have_http_status :unprocessable_content
      expect(response.parsed_body["error"]).to eq "Error anonymizing: This person is currently banned and cannot be anonymized."
    end

    it 'cannot anonymize if both user ID and WCA ID is not provided' do
      post :anonymize

      expect(response).to have_http_status :unprocessable_content
      expect(response.parsed_body["error"]).to eq "User ID and WCA ID is not provided."
    end

    it 'cannot anonymize if user ID connected with WCA ID is not the user ID provided' do
      person = create(:person_who_has_competed_once)
      user = create(:user)

      post :anonymize, params: { userId: user.id, wcaId: person.wca_id }

      expect(response).to have_http_status :unprocessable_content
      expect(response.parsed_body["error"]).to eq "Person and user not linked."
    end

    it 'generates padded wca id for a year with 99 ANON ids already' do
      person = create(:person_who_has_competed_once)
      wca_id = person.wca_id
      year = wca_id.first(4)

      (1..99).each do |i|
        create(:person_who_has_competed_once, wca_id: year + "ANON" + i.to_s.rjust(2, "0"))
      end

      post :anonymize, params: { wcaId: wca_id }

      expect(person.reload.wca_id).to eq year + "ANOU01" # ANON, take the last N, pad with U.
    end

    it "can anonymize person and results" do
      person = create(:person_who_has_competed_once)
      result = create(:result, person: person)

      post :anonymize, params: { wcaId: person.wca_id }

      expect(response).to be_successful
      result.reload
      person.reload
      expect(result.personId).to include('ANON')
      expect(result.personName).to eq User::ANONYMOUS_NAME
      expect(person.wca_id).to include('ANON')
      expect(person.name).to eq User::ANONYMOUS_NAME
      expect(person.gender).to eq User::ANONYMOUS_GENDER
      expect(person.dob).to eq User::ANONYMOUS_DOB.to_date
    end

    it "can anonymize account data" do
      user = create(:user_with_wca_id)
      create(:result, person: user.person)

      post :anonymize, params: { userId: user.id }

      expect(response).to be_successful
      user.reload
      expect(user.wca_id).to be nil
      expect(user.email).to eq user.id.to_s + User::ANONYMOUS_ACCOUNT_EMAIL_ID_SUFFIX
      expect(user.name).to eq User::ANONYMOUS_NAME
      expect(user.dob).to eq User::ANONYMOUS_DOB.to_date
      expect(user.gender).to eq User::ANONYMOUS_GENDER
    end
  end
end
