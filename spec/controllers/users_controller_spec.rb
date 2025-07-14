# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UsersController do
  describe "GET #edit" do
    let(:user) { create(:user_with_wca_id) }

    before { sign_in create :admin }

    it "populates user" do
      get :edit, params: { id: user.id }
      expect(assigns(:user)).to eq user
    end
  end

  describe "claim wca id" do
    let!(:person) { create(:person) }
    let!(:delegate) { create(:delegate) }
    let!(:user) { create(:user) }

    before :each do
      sign_in user
    end

    it "works" do
      expect(WcaIdClaimMailer).to receive(:notify_delegate_of_wca_id_claim).with(user).and_call_original
      expect do
        patch :update, params: { id: user, user: { claiming_wca_id: true, unconfirmed_wca_id: person.wca_id, delegate_id_to_handle_wca_id_claim: delegate.id, dob_verification: person.dob.strftime("%F") } }
      end.to change(enqueued_jobs, :size).by(1)
      new_user = assigns(:user)
      expect(new_user).to be_valid
      expect(user.reload.unconfirmed_wca_id).to eq person.wca_id
      expect(flash[:success]).to eq "Successfully claimed WCA ID #{person.wca_id}. Check your email, and wait for #{delegate.name} to approve it!"
      expect(response).to redirect_to profile_claim_wca_id_path
    end

    it "cannot claim wca id for another user" do
      other_user = create(:user)

      old_unconfirmed_wca_id = other_user.unconfirmed_wca_id
      patch :update, params: { id: other_user.id, user: { claiming_wca_id: true, unconfirmed_wca_id: person.wca_id, delegate_id_to_handle_wca_id_claim: delegate.id } }
      expect(other_user.unconfirmed_wca_id).to eq old_unconfirmed_wca_id
    end

    it "cannot claim wca id if already has a wca id" do
      other_person = create(:person)
      user.update!(wca_id: other_person.wca_id, name: other_person.name, country_iso2: other_person.country_iso2,
                   dob: other_person.dob, gender: other_person.gender)

      patch :update, params: { id: user, user: { claiming_wca_id: true, unconfirmed_wca_id: person.wca_id, delegate_id_to_handle_wca_id_claim: delegate.id } }
      new_user = assigns(:user)
      expect(new_user).not_to be_valid
      expect(user.reload.unconfirmed_wca_id).to be_nil
    end
  end

  describe "approve wca id claim" do
    let!(:delegate) { create(:delegate) }
    let(:person) { create(:person) }
    let(:user) { create(:user, unconfirmed_wca_id: person.wca_id, delegate_to_handle_wca_id_claim: delegate, dob_verification: person.dob) }

    before :each do
      sign_in delegate
    end

    it "works when not explicitly clearing unconfirmed_wca_id" do
      patch :update, params: { id: user, user: { wca_id: user.unconfirmed_wca_id } }
      user.reload
      expect(user.wca_id).to eq person.wca_id
      expect(user.unconfirmed_wca_id).to be_nil
      expect(user.delegate_to_handle_wca_id_claim).to be_nil
    end

    it "works when explicitly clearing unconfirmed_wca_id" do
      patch :update, params: { id: user, user: { wca_id: user.unconfirmed_wca_id, unconfirmed_wca_id: "" } }
      user.reload
      expect(user.wca_id).to eq person.wca_id
      expect(user.unconfirmed_wca_id).to be_nil
      expect(user.delegate_to_handle_wca_id_claim).to be_nil
    end

    it "can set id to something not claimed if the details match" do
      person2 = create(:person, name: user.name, country_id: user.country.id,
                                dob: user.dob, gender: user.gender)
      patch :update, params: { id: user, user: { wca_id: person2.wca_id } }
      user.reload
      expect(user.wca_id).to eq person2.wca_id
      expect(user.unconfirmed_wca_id).to eq person.wca_id
      expect(user.delegate_to_handle_wca_id_claim).to eq delegate
    end

    it "can change claimed id" do
      person2 = create(:person)
      patch :update, params: { id: user, user: { unconfirmed_wca_id: person2.wca_id } }
      user.reload
      expect(user.unconfirmed_wca_id).to eq person2.wca_id
      expect(user.delegate_to_handle_wca_id_claim).to eq delegate
    end

    it "can clear claimed id" do
      create(:person)
      patch :update, params: { id: user, user: { unconfirmed_wca_id: "" } }
      user.reload
      expect(user.unconfirmed_wca_id).to be_nil
      expect(user.delegate_to_handle_wca_id_claim).to be_nil
    end
  end

  describe "editing user data" do
    let!(:user) { create(:user) }
    let!(:delegate) { create(:delegate) }

    context "recently authenticated" do
      it "user can change email" do
        sign_in user
        expect(user.confirmation_sent_at).to be_nil
        post :authenticate_user_for_sensitive_edit, params: { user: { password: "wca" } }
        patch :update, params: { id: user.id, user: { email: "newEmail@newEmail.com" } }
        user.reload
        expect(user.unconfirmed_email).to eq "newemail@newemail.com"
        expect(user.confirmation_sent_at).not_to be_nil
      end
    end

    context "not recently authenticated" do
      it "cannot change email" do
        sign_in user
        patch :update, params: { id: user.id, user: { email: "newEmail@newEmail.com" } }
        user.reload
        expect(user.unconfirmed_email).to be_nil
        expect(user.confirmation_sent_at).to be_nil
        expect(flash[:danger]).to eq I18n.t("users.edit.sensitive.identity_error")
      end
    end

    it "user can change name" do
      sign_in user
      patch :update, params: { id: user.id, user: { name: "Johnny 5" } }
      expect(user.reload.name).to eq "Johnny 5"
    end

    it "user can change his preferred events" do
      sign_in user
      patch :update, params: { id: user.id, user: { user_preferred_events_attributes: [{ event_id: "333" }, { event_id: "444" }, { event_id: "clock" }] } }
      expect(user.reload.preferred_events.map(&:id)).to eq %w[333 444 clock]
    end

    context "after creating a pending registration" do
      let!(:registration) { create(:registration, :pending, user: user) }

      it "user can change name" do
        sign_in user
        patch :update, params: { id: user.id, user: { name: "Johnny 5" } }
        expect(user.reload.name).to eq "Johnny 5"
      end
    end

    context "after having a registration deleted" do
      let!(:registration) { create(:registration, :cancelled, user: user) }

      it "user can change name" do
        sign_in user
        patch :update, params: { id: user.id, user: { name: "Johnny 5" } }
        expect(user.reload.name).to eq "Johnny 5"
      end
    end

    context "after registration is accepted for a competition" do
      let!(:registration) { create(:registration, :accepted, user: user) }

      it "user cannot change name" do
        sign_in user
        old_name = user.name
        patch :update, params: { id: user.id, user: { name: "Johnny 5" } }
        expect(user.reload.name).to eq old_name
      end

      it "delegate can still change name" do
        sign_in delegate
        patch :update, params: { id: user.id, user: { name: "Johnny 5" } }
        expect(user.reload.name).to eq "Johnny 5"
      end
    end
  end

  describe "GET #index" do
    before { sign_in create :admin }

    it "is injection safe" do
      get :index, params: { format: :json, sort: "country", order: "ASC -- HMM" }
      users = assigns(:users)
      sql = users.to_sql
      expect(sql).not_to match "HMM"
      expect(sql).to match(/order by .+ desc/i)
    end
  end

  describe "POST #acknowledge_cookies" do
    context 'not signed in' do
      it 'requires authentication' do
        post :acknowledge_cookies
        expect(response).to have_http_status :unauthorized
        response_json = response.parsed_body
        expect(response_json['ok']).to be false
      end
    end

    context 'signed in' do
      let!(:admin) { create(:admin, cookies_acknowledged: false) }

      before :each do
        sign_in admin
      end

      it "records acknowledgement and is idempotent" do
        expect(admin.reload.cookies_acknowledged).to be false
        post :acknowledge_cookies
        response_json = response.parsed_body
        expect(response_json['ok']).to be true
        expect(admin.reload.cookies_acknowledged).to be true

        # Do the same thing again. This shouldn't clear their cookies acknowledged
        # state.
        post :acknowledge_cookies
        response_json = response.parsed_body
        expect(response_json['ok']).to be true
        expect(admin.reload.cookies_acknowledged).to be true
      end
    end
  end

  describe 'POST #merge' do
    let(:user1) { create(:user, :wca_id) }
    let(:shared_attributes) { user1.attributes.symbolize_keys.slice(:name, :country_iso2, :gender, :dob) }
    let(:user2) { create(:user, :wca_id, shared_attributes) }

    context 'signed in as WRT member' do
      before :each do
        sign_in create :user, :wrt_member
      end

      it 'requires different people' do
        post :merge, params: {
          toUserId: user1.id,
          fromUserId: user1.id,
        }

        expect(response).to have_http_status :bad_request
        parsed_body = response.parsed_body
        expect(parsed_body["error"]).to eq "Cannot merge user with itself"
      end

      it 'requires at least one not to have WCA ID' do
        post :merge, params: {
          toUserId: user1.id,
          fromUserId: user2.id,
        }

        expect(response).to have_http_status :bad_request
        parsed_body = response.parsed_body
        expect(parsed_body["error"]).to eq "Cannot merge users with both having a WCA ID"
      end

      it 'requires same name' do
        user2.update!(wca_id: nil, name: "#{user1.name} Different") # Adding a suffix to make it different.

        post :merge, params: {
          toUserId: user1.id,
          fromUserId: user2.id,
        }

        expect(response).to have_http_status :bad_request
        parsed_body = response.parsed_body
        expect(parsed_body["error"]).to eq "Cannot merge users with different details"
      end

      it 'requires same country' do
        user2.update!(wca_id: nil, country_iso2: Country.real.where.not(iso2: user1.country_iso2).sample.iso2)

        post :merge, params: {
          toUserId: user1.id,
          fromUserId: user2.id,
        }

        expect(response).to have_http_status :bad_request
        parsed_body = response.parsed_body
        expect(parsed_body["error"]).to eq "Cannot merge users with different details"
      end

      it 'requires same gender' do
        user1.update!(gender: User::ALLOWABLE_GENDERS[0])
        user2.update!(wca_id: nil, gender: User::ALLOWABLE_GENDERS[1])

        post :merge, params: {
          toUserId: user1.id,
          fromUserId: user2.id,
        }

        expect(response).to have_http_status :bad_request
        parsed_body = response.parsed_body
        expect(parsed_body["error"]).to eq "Cannot merge users with different details"
      end

      it 'requires same dob' do
        user2.update!(wca_id: nil, dob: user1.dob + 1.day)

        post :merge, params: {
          toUserId: user1.id,
          fromUserId: user2.id,
        }

        expect(response).to have_http_status :bad_request
        parsed_body = response.parsed_body
        expect(parsed_body["error"]).to eq "Cannot merge users with different details"
      end

      it 'merges users' do
        user1.update!(wca_id: nil)
        user2_wca_id = user2.wca_id
        create(:user_role, :active, :wrc_member, user: user2)
        create(:competition, :past, delegates: [user2], organizers: [user2], announced_by: user2.id, results_posted_by: user2.id)

        post :merge, params: {
          toUserId: user1.id,
          fromUserId: user2.id,
        }

        expect(response).to have_http_status :ok
        expect(user1.reload.wca_id).to eq user2_wca_id
        expect(user2.reload.wca_id).to be_nil
        expect(user1.roles.count).to eq 1
        expect(user2.roles.count).to eq 0
        expect(user1.competition_organizers.count).to eq 1
        expect(user1.competition_delegates.count).to eq 1
        expect(user1.competitions_announced.count).to eq 1
        expect(user1.competitions_results_posted.count).to eq 1
        expect(user2.competition_organizers.count).to eq 0
        expect(user2.competition_delegates.count).to eq 0
        expect(user2.competitions_announced.count).to eq 0
        expect(user2.competitions_results_posted.count).to eq 0
      end
    end
  end
end
