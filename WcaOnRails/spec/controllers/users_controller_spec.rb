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

  describe "request wca id" do
    let!(:person) { FactoryGirl.create(:person) }
    let!(:delegate) { FactoryGirl.create(:delegate) }
    let!(:user) { FactoryGirl.create(:user) }

    before :each do
      sign_in user
    end

    it "works" do
      expect(WcaIdRequestMailer).to receive(:notify_delegate_of_wca_id_request).with(user).and_call_original
      expect do
        patch :do_request_wca_id, user: { unconfirmed_wca_id: person.id, delegate_id_to_handle_wca_id_request: delegate.id }
      end.to change { ActionMailer::Base.deliveries.length }.by(1)
      new_user = assigns(:user)
      expect(new_user).to be_valid
      expect(user.reload.unconfirmed_wca_id).to eq person.id
      expect(flash[:success]).to eq "Successfully requested WCA id #{person.id}. Check your email, and wait for #{delegate.name} to approve it!"
      expect(response).to redirect_to profile_request_wca_id_path
    end

    it "cannot request wca id for another user" do
      other_user = FactoryGirl.create :user

      patch :do_request_wca_id, id: other_user.id, user: { unconfirmed_wca_id: person.id, delegate_id_to_handle_wca_id_request: delegate.id }
      new_user = assigns(:user)
      expect(new_user.id).to eq user.id
    end

    it "cannot request wca id if already has a wca id" do
      other_person = FactoryGirl.create :person
      user.wca_id = other_person.id
      user.save!

      patch :do_request_wca_id, user: { unconfirmed_wca_id: person.id, delegate_id_to_handle_wca_id_request: delegate.id }
      new_user = assigns(:user)
      expect(new_user).to be_invalid
      expect(user.reload.unconfirmed_wca_id).to be_nil
    end
  end

  describe "approve wca id request" do
    let(:delegate) { FactoryGirl.create(:delegate) }
    let(:person) { FactoryGirl.create(:person) }
    let(:user) { FactoryGirl.create :user, unconfirmed_wca_id: person.id, delegate_to_handle_wca_id_request: delegate }

    before :each do
      sign_in delegate
    end

    it "works when not explicitly clearing unconfirmed_wca_id" do
      patch :update, id: user, user: { wca_id: user.unconfirmed_wca_id }
      user.reload
      expect(user.wca_id).to eq person.id
      expect(user.unconfirmed_wca_id).to be_nil
      expect(user.delegate_to_handle_wca_id_request).to be_nil
    end

    it "works when explicitly clearing unconfirmed_wca_id" do
      patch :update, id: user, user: { wca_id: user.unconfirmed_wca_id, unconfirmed_wca_id: "" }
      user.reload
      expect(user.wca_id).to eq person.id
      expect(user.unconfirmed_wca_id).to be_nil
      expect(user.delegate_to_handle_wca_id_request).to be_nil
    end

    it "can set id to something not requested" do
      person2 = FactoryGirl.create :person
      patch :update, id: user, user: { wca_id: person2.id }
      user.reload
      expect(user.wca_id).to eq person2.id
      expect(user.unconfirmed_wca_id).to eq person.id
      expect(user.delegate_to_handle_wca_id_request).to eq delegate
    end

    it "can change requested id" do
      person2 = FactoryGirl.create :person
      patch :update, id: user, user: { unconfirmed_wca_id: person2.id }
      user.reload
      expect(user.unconfirmed_wca_id).to eq person2.id
      expect(user.delegate_to_handle_wca_id_request).to eq delegate
    end

    it "can clear requested id" do
      person2 = FactoryGirl.create :person
      patch :update, id: user, user: { unconfirmed_wca_id: "" }
      user.reload
      expect(user.unconfirmed_wca_id).to be_nil
      expect(user.delegate_to_handle_wca_id_request).to be_nil
    end
  end
end
