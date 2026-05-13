# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TicketsController do
  describe "POST #anonymize" do
    before { sign_in create :admin }

    it 'can anonymize person' do
      person = create(:person_who_has_competed_once)
      wca_id = person.wca_id

      post :anonymize, params: { wcaId: wca_id }

      expect(person.reload.name).to eq User::ANONYMOUS_NAME
      expect(person.reload.wca_id).to include("#{wca_id.first(4)}ANON")
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
        create(:person_who_has_competed_once, wca_id: "#{year}ANON#{i.to_s.rjust(2, '0')}")
      end

      post :anonymize, params: { wcaId: wca_id }

      expect(person.reload.wca_id).to eq "#{year}ANOU01" # ANON, take the last N, pad with U.
    end

    it "can anonymize person and results" do
      person = create(:person_who_has_competed_once)
      result = create(:result, person: person)

      post :anonymize, params: { wcaId: person.wca_id }

      expect(response).to be_successful
      result.reload
      person.reload
      expect(result.person_id).to include('ANON')
      expect(result.person_name).to eq User::ANONYMOUS_NAME
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
      expect(user.wca_id).to be_nil
      expect(user.email).to eq user.id.to_s + User::ANONYMOUS_ACCOUNT_EMAIL_ID_SUFFIX
      expect(user.name).to eq User::ANONYMOUS_NAME
      expect(user.dob).to eq User::ANONYMOUS_DOB.to_date
      expect(user.gender).to eq User::ANONYMOUS_GENDER
    end
  end

  describe 'POST #post_results' do
    context 'when signed in as results team member' do
      let(:results_ticket) { create(:competition_result_ticket) }
      let(:wrt_member) { create(:user, :wrt_member) }

      before :each do
        sign_in wrt_member
      end

      it "sends the notification emails to users that competed" do
        competition = results_ticket.competition
        round = create(:round, competition: competition, number: 2)
        create_list(:user_with_wca_id, 4, results_notifications_enabled: true).each do |user|
          create(:result, person: user.person, competition_id: competition.id, event_id: "333", round: round)
        end

        expect(competition.results_posted_at).to be_nil
        expect(competition.results_posted_by).to be_nil
        expect(CompetitionsMailer).to receive(:notify_users_of_results_presence).and_call_original.exactly(4).times
        expect do
          post :post_results, params: { ticket_id: results_ticket.ticket.id }
        end.to change(enqueued_jobs, :size).by(4)
        competition.reload
        expect(competition.results_posted_at.to_f).to be < Time.now.to_f
        expect(competition.results_posted_by).to eq wrt_member.id
      end

      it "sends notifications of id claim possibility to newcomers" do
        competition = results_ticket.competition
        create_list(:registration, 2, :accepted, :newcomer, competition: competition)
        create_list(:registration, 3, :pending, :newcomer, competition: competition)
        create_list(:registration, 4, :accepted, competition: competition)
        round = create(:round, competition: competition, number: 2)
        create_list(:user_with_wca_id, 4).each do |user|
          create(:result, person: user.person, competition_id: competition.id, event_id: "333", round: round)
        end

        expect(CompetitionsMailer).to receive(:notify_users_of_id_claim_possibility).and_call_original.twice
        expect do
          post :post_results, params: { ticket_id: results_ticket.ticket.id }
        end.to change(enqueued_jobs, :size).by(2)
      end

      it "assigns wca id when user matches one person in results" do
        competition = results_ticket.competition
        reg = create(:registration, :accepted, competition: competition)
        round = create(:round, competition: competition, number: 2)
        create(:result, competition: competition, person: reg.person, event_id: "333", round: round)

        wca_id = reg.user.wca_id
        reg.user.update(wca_id: nil)

        post :post_results, params: { ticket_id: results_ticket.ticket.id }

        expect(reg.user.reload.wca_id).to eq wca_id
      end

      it "does not assign wca id when user matches several persons in results" do
        competition = results_ticket.competition
        user = create(:user_with_wca_id)
        person = user.person
        create(:registration, :accepted, competition: competition, user: user)
        round = create(:round, competition: competition, number: 2)
        create(:result, competition: competition, person: person, event_id: "333", round: round)
        another_person = create(:person, name: person.name, country_id: person.country_id, gender: person.gender, dob: person.dob)
        create(:result, competition: competition, person: another_person, event_id: "333", round: round)

        user.update(wca_id: nil)

        post :post_results, params: { ticket_id: results_ticket.ticket.id }

        expect(user.reload.wca_id).to be_nil
      end

      it "does not assign wca id when user matches results but wca id is already assigned" do
        competition = results_ticket.competition
        user = create(:user_with_wca_id)
        user2 = create(:user_with_wca_id)
        round = create(:round, competition: competition, number: 2)
        create(:registration, :accepted, competition: competition, user: user)
        create(:result, competition: competition, person: user.person, event_id: "333", round: round)

        wca_id = user.wca_id
        user.update(wca_id: nil)
        user2.update(wca_id: wca_id)

        post :post_results, params: { ticket_id: results_ticket.ticket.id }

        expect(user.reload.wca_id).to be_nil
      end
    end
  end

  describe "POST #approve_edit_person_request" do
    let(:wrt_member) { create(:user, :wrt_member) }

    before do
      sign_in wrt_member
    end

    context "when the person's data is out of sync" do
      let(:edit_name_ticket) { create(:edit_name_ticket) }

      before do
        edit_name_ticket.person.update!(name: "John Doe")
      end

      it "returns unprocessable content with an error message" do
        post :approve_edit_person_request, params: {
          ticket_id: edit_name_ticket.ticket.id,
          acting_stakeholder_id: edit_name_ticket.ticket.user_stakeholders(wrt_member)[0].id,
          change_type: "update",
        }

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["error"]).to include("The person's data has changed")
      end
    end

    context "when the request is valid" do
      %w[fix update].each do |change_type|
        [
          {
            edit_field: "name",
            factory: :edit_name_ticket,
          },
          {
            edit_field: "dob",
            factory: :edit_dob_ticket,
          },
          {
            edit_field: "country",
            factory: :edit_country_ticket,
          },
          {
            edit_field: "gender",
            factory: :edit_gender_ticket,
          },
        ].each do |data|
          it "executes the request for #{data[:edit_field]} #{change_type}" do
            edit_person_ticket = create(data[:factory])

            field = edit_person_ticket.tickets_edit_person_fields.first
            expected_params = { field.field_name.to_sym => field.new_value }

            if field.field_name.to_sym == :country_iso2
              # Temporary hack till we migrate to using country_iso2 everywhere
              expected_params = { country_id: Country.find_by(iso2: field.new_value).id }
            end

            expect_any_instance_of(Person).to receive(:execute_edit_person_request).with(change_type, expected_params)

            post :approve_edit_person_request, params: {
              ticket_id: edit_person_ticket.ticket.id,
              acting_stakeholder_id: edit_person_ticket.ticket.user_stakeholders(wrt_member)[0].id,
              change_type: change_type,
            }

            expect(response).to have_http_status(:ok)
          end
        end
      end
    end
  end
end
