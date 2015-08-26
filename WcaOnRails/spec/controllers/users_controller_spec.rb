require 'rails_helper'

describe UsersController do
  sign_in { FactoryGirl.create :admin }

  let(:user) { FactoryGirl.create(:user, wca_id: "2005FLEI01") }

  describe "GET #edit" do
    it "populates user" do
      get :edit, id: user.id
      expect(assigns(:user)).to eq user
    end
  end
end
