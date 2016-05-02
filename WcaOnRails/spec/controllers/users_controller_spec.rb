require 'rails_helper'

describe UsersController do

  describe "GET #edit" do
    let(:user) { FactoryGirl.create(:user_with_wca_id) }

    sign_in { FactoryGirl.create :admin }

    it "populates user" do
      get :edit, id: user.id
      expect(assigns(:user)).to eq user
    end
  end

  describe "claim wca id" do
    let!(:person) { FactoryGirl.create(:person) }
    let!(:delegate) { FactoryGirl.create(:delegate) }
    let!(:user) { FactoryGirl.create(:user) }

    before :each do
      sign_in user
    end

    it "works" do
      expect(WcaIdClaimMailer).to receive(:notify_delegate_of_wca_id_claim).with(user).and_call_original
      expect do
        patch :update, id: user, user: { claiming_wca_id: true, unconfirmed_wca_id: person.id, delegate_id_to_handle_wca_id_claim: delegate.id, dob_verification: person.dob.strftime("%F") }
      end.to change { ActionMailer::Base.deliveries.length }.by(1)
      new_user = assigns(:user)
      expect(new_user).to be_valid
      expect(user.reload.unconfirmed_wca_id).to eq person.id
      expect(flash[:success]).to eq "Successfully claimed WCA ID #{person.id}. Check your email, and wait for #{delegate.name} to approve it!"
      expect(response).to redirect_to profile_claim_wca_id_path
    end

    it "cannot claim wca id for another user" do
      other_user = FactoryGirl.create :user

      old_unconfirmed_wca_id = other_user.unconfirmed_wca_id
      patch :update, id: other_user.id, user: { claiming_wca_id: true, unconfirmed_wca_id: person.id, delegate_id_to_handle_wca_id_claim: delegate.id }
      expect(other_user.unconfirmed_wca_id).to eq old_unconfirmed_wca_id
    end

    it "cannot claim wca id if already has a wca id" do
      other_person = FactoryGirl.create :person
      user.wca_id = other_person.id
      user.save!

      patch :update, id: user, user: { claiming_wca_id: true, unconfirmed_wca_id: person.id, delegate_id_to_handle_wca_id_claim: delegate.id }
      new_user = assigns(:user)
      expect(new_user).to be_invalid
      expect(user.reload.unconfirmed_wca_id).to be_nil
    end
  end

  describe "approve wca id claim" do
    let(:delegate) { FactoryGirl.create(:delegate) }
    let(:person) { FactoryGirl.create(:person) }
    let(:user) { FactoryGirl.create :user, unconfirmed_wca_id: person.id, delegate_to_handle_wca_id_claim: delegate, dob_verification: person.dob }

    before :each do
      sign_in delegate
    end

    it "works when not explicitly clearing unconfirmed_wca_id" do
      patch :update, id: user, user: { wca_id: user.unconfirmed_wca_id }
      user.reload
      expect(user.wca_id).to eq person.id
      expect(user.unconfirmed_wca_id).to be_nil
      expect(user.delegate_to_handle_wca_id_claim).to be_nil
    end

    it "works when explicitly clearing unconfirmed_wca_id" do
      patch :update, id: user, user: { wca_id: user.unconfirmed_wca_id, unconfirmed_wca_id: "" }
      user.reload
      expect(user.wca_id).to eq person.id
      expect(user.unconfirmed_wca_id).to be_nil
      expect(user.delegate_to_handle_wca_id_claim).to be_nil
    end

    it "can set id to something not claimed" do
      person2 = FactoryGirl.create :person
      patch :update, id: user, user: { wca_id: person2.id }
      user.reload
      expect(user.wca_id).to eq person2.id
      expect(user.unconfirmed_wca_id).to eq person.id
      expect(user.delegate_to_handle_wca_id_claim).to eq delegate
    end

    it "can change claimed id" do
      person2 = FactoryGirl.create :person
      patch :update, id: user, user: { unconfirmed_wca_id: person2.id }
      user.reload
      expect(user.unconfirmed_wca_id).to eq person2.id
      expect(user.delegate_to_handle_wca_id_claim).to eq delegate
    end

    it "can clear claimed id" do
      FactoryGirl.create :person
      patch :update, id: user, user: { unconfirmed_wca_id: "" }
      user.reload
      expect(user.unconfirmed_wca_id).to be_nil
      expect(user.delegate_to_handle_wca_id_claim).to be_nil
    end
  end

  describe "editing user data" do
    let(:user) { FactoryGirl.create(:user) }
    let(:delegate) { FactoryGirl.create(:delegate) }

    it "user can change email" do
      sign_in user
      expect(user.confirmation_sent_at).to eq nil
      patch :update, id: user.id, user: { email: "newEmail@newEmail.com", current_password: "wca" }
      user.reload
      expect(user.unconfirmed_email).to eq "newemail@newemail.com"
      expect(user.confirmation_sent_at).not_to eq nil
    end

    it "user can change name" do
      sign_in user
      patch :update, id: user.id, user: { name: "Johnny 5" }
      expect(user.reload.name).to eq "Johnny 5"
    end

    it "user can change his preferred events" do
      sign_in user
      patch :update, id: user.id, user: { preferred_event_ids: { "333" => "1", "444" => "1", "clock" => "1" } }
      expect(user.reload.preferred_event_ids).to eq "333 444 clock"
    end

    context "after registering for a competition" do
      let!(:registration) { FactoryGirl.create(:registration, user: user) }

      it "user cannot change name" do
        sign_in user
        old_name = user.name
        patch :update, id: user.id, user: { name: "Johnny 5" }
        expect(user.reload.name).to eq old_name
      end

      it "delegate can still change name" do
        sign_in delegate
        patch :update, id: user.id, user: { name: "Johnny 5" }
        expect(user.reload.name).to eq "Johnny 5"
      end
    end
  end
end
