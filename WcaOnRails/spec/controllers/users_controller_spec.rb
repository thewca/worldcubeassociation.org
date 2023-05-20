# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UsersController do
  describe "GET #edit" do
    let(:user) { FactoryBot.create(:user_with_wca_id) }

    sign_in { FactoryBot.create :admin }

    it "populates user" do
      get :edit, params: { id: user.id }
      expect(assigns(:user)).to eq user
    end
  end

  describe "claim wca id" do
    let!(:person) { FactoryBot.create(:person) }
    let!(:delegate) { FactoryBot.create(:delegate) }
    let!(:user) { FactoryBot.create(:user) }

    before :each do
      sign_in user
    end

    it "works" do
      expect(WcaIdClaimMailer).to receive(:notify_delegate_of_wca_id_claim).with(user).and_call_original
      expect do
        patch :update, params: { id: user, user: { claiming_wca_id: true, unconfirmed_wca_id: person.wca_id, delegate_id_to_handle_wca_id_claim: delegate.id, dob_verification: person.dob.strftime("%F") } }
      end.to change { enqueued_jobs.size }.by(1)
      new_user = assigns(:user)
      expect(new_user).to be_valid
      expect(user.reload.unconfirmed_wca_id).to eq person.wca_id
      expect(flash[:success]).to eq "Successfully claimed WCA ID #{person.wca_id}. Check your email, and wait for #{delegate.name} to approve it!"
      expect(response).to redirect_to profile_claim_wca_id_path
    end

    it "cannot claim wca id for another user" do
      other_user = FactoryBot.create :user

      old_unconfirmed_wca_id = other_user.unconfirmed_wca_id
      patch :update, params: { id: other_user.id, user: { claiming_wca_id: true, unconfirmed_wca_id: person.wca_id, delegate_id_to_handle_wca_id_claim: delegate.id } }
      expect(other_user.unconfirmed_wca_id).to eq old_unconfirmed_wca_id
    end

    it "cannot claim wca id if already has a wca id" do
      other_person = FactoryBot.create(:person)
      user.update!(wca_id: other_person.wca_id, name: other_person.name, country_iso2: other_person.country_iso2,
                   dob: other_person.dob, gender: other_person.gender)

      patch :update, params: { id: user, user: { claiming_wca_id: true, unconfirmed_wca_id: person.wca_id, delegate_id_to_handle_wca_id_claim: delegate.id } }
      new_user = assigns(:user)
      expect(new_user).to be_invalid
      expect(user.reload.unconfirmed_wca_id).to be_nil
    end
  end

  describe "approve wca id claim" do
    let!(:delegate) { FactoryBot.create(:delegate) }
    let(:person) { FactoryBot.create(:person) }
    let(:user) { FactoryBot.create :user, unconfirmed_wca_id: person.wca_id, delegate_to_handle_wca_id_claim: delegate, dob_verification: person.dob }

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
      person2 = FactoryBot.create :person, name: user.name, countryId: user.country.id,
                                           dob: user.dob, gender: user.gender
      patch :update, params: { id: user, user: { wca_id: person2.wca_id } }
      user.reload
      expect(user.wca_id).to eq person2.wca_id
      expect(user.unconfirmed_wca_id).to eq person.wca_id
      expect(user.delegate_to_handle_wca_id_claim).to eq delegate
    end

    it "can change claimed id" do
      person2 = FactoryBot.create :person
      patch :update, params: { id: user, user: { unconfirmed_wca_id: person2.wca_id } }
      user.reload
      expect(user.unconfirmed_wca_id).to eq person2.wca_id
      expect(user.delegate_to_handle_wca_id_claim).to eq delegate
    end

    it "can clear claimed id" do
      FactoryBot.create :person
      patch :update, params: { id: user, user: { unconfirmed_wca_id: "" } }
      user.reload
      expect(user.unconfirmed_wca_id).to be_nil
      expect(user.delegate_to_handle_wca_id_claim).to be_nil
    end
  end

  describe "editing user data" do
    let!(:user) { FactoryBot.create(:user) }
    let!(:delegate) { FactoryBot.create(:delegate) }

    context "recently authenticated" do
      it "user can change email" do
        sign_in user
        expect(user.confirmation_sent_at).to eq nil
        post :authenticate_user_for_sensitive_edit, params: { user: { password: "wca" } }
        patch :update, params: { id: user.id, user: { email: "newEmail@newEmail.com" } }
        user.reload
        expect(user.unconfirmed_email).to eq "newemail@newemail.com"
        expect(user.confirmation_sent_at).not_to eq nil
      end
    end

    context "not recently authenticated" do
      it "cannot change email" do
        sign_in user
        patch :update, params: { id: user.id, user: { email: "newEmail@newEmail.com" } }
        user.reload
        expect(user.unconfirmed_email).to eq nil
        expect(user.confirmation_sent_at).to eq nil
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
      expect(user.reload.preferred_events.map(&:id)).to eq %w(333 444 clock)
    end

    context "after creating a pending registration" do
      let!(:registration) { FactoryBot.create(:registration, :pending, user: user) }
      it "user can change name" do
        sign_in user
        patch :update, params: { id: user.id, user: { name: "Johnny 5" } }
        expect(user.reload.name).to eq "Johnny 5"
      end
    end

    context "after having a registration deleted" do
      let!(:registration) { FactoryBot.create(:registration, :deleted, user: user) }
      it "user can change name" do
        sign_in user
        patch :update, params: { id: user.id, user: { name: "Johnny 5" } }
        expect(user.reload.name).to eq "Johnny 5"
      end
    end

    context "after registration is accepted for a competition" do
      let!(:registration) { FactoryBot.create(:registration, :accepted, user: user) }

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

    context "when the delegate status of a user is changed by a senior delegate" do
      let!(:user_who_makes_the_change) { FactoryBot.create(:senior_delegate) }
      let(:user_senior_delegate) { FactoryBot.create(:senior_delegate) }
      let(:user_whose_delegate_status_changes) { FactoryBot.create(:delegate, delegate_status: "candidate_delegate", senior_delegate: user_senior_delegate) }

      it "notifies the board and the wqac via email" do
        sign_in user_who_makes_the_change
        expect(DelegateStatusChangeMailer).to receive(:notify_board_and_assistants_of_delegate_status_change).with(user_whose_delegate_status_changes, user_who_makes_the_change, user_senior_delegate).and_call_original
        expect do
          patch :update, params: { id: user_whose_delegate_status_changes.id, user: { delegate_status: "delegate" } }
        end.to change { enqueued_jobs.size }.by(1)

        expect(user_whose_delegate_status_changes.reload.delegate_status).to eq "delegate"
      end
    end
  end

  describe "GET #index" do
    sign_in { FactoryBot.create :admin }

    it "is injection safe" do
      get :index, params: { format: :json, sort: "country", order: "ASC -- HMM" }
      users = assigns(:users)
      sql = users.to_sql
      expect(sql).to_not match "HMM"
      expect(sql).to match(/order by .+ desc/i)
    end
  end

  describe "POST #acknowledge_cookies" do
    context 'not signed in' do
      it 'requires authentication' do
        post :acknowledge_cookies
        expect(response.status).to eq 401
        response_json = JSON.parse(response.body)
        expect(response_json['ok']).to eq false
      end
    end

    context 'signed in' do
      let!(:admin) { FactoryBot.create :admin, cookies_acknowledged: false }

      before :each do
        sign_in admin
      end

      it "records acknowledgement and is idempotent" do
        expect(admin.reload.cookies_acknowledged).to be false
        post :acknowledge_cookies
        response_json = JSON.parse(response.body)
        expect(response_json['ok']).to eq true
        expect(admin.reload.cookies_acknowledged).to be true

        # Do the same thing again. This shouldn't clear their cookies acknowledged
        # state.
        post :acknowledge_cookies
        response_json = JSON.parse(response.body)
        expect(response_json['ok']).to eq true
        expect(admin.reload.cookies_acknowledged).to be true
      end
    end
  end
end
