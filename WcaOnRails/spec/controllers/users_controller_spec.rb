require 'rails_helper'

describe UsersController do
  login_admin

  let(:user) { FactoryGirl.create(:user, wca_id: "2005FLEI01") }

  describe "GET #edit" do
    it "populates user" do
      get :edit, id: user.id
      expect(assigns(:user)).to eq user
    end

    it "redirects wca id to id" do
      get :edit, id: user.wca_id
      expect(response).to redirect_to edit_user_path(user)
    end
  end
end
