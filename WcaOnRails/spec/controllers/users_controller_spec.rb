require 'rails_helper'

describe UsersController do
  sign_in { FactoryGirl.create :admin }

  let(:user) { FactoryGirl.create(:user_with_wca_id) }

  describe "GET #edit" do
    it "populates user" do
      get :edit, id: user.id
      expect(assigns(:user)).to eq user
    end
  end
end
