require 'rails_helper'

describe TeamsController do

  describe "GET #index" do
    context "when not signed in" do
      sign_out

      it 'redirects to the sign in page' do
        get :index
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as admin" do
      sign_in { FactoryGirl.create :admin }

      it 'shows the teams index page' do
        get :index
        expect(response).to render_template :index
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'does not allow access' do
        get :index
        expect(response).to redirect_to root_url
      end
    end
  end

  describe "GET #new" do
    context "when not signed in" do
      sign_out

      it 'redirects to the sign in page' do
        get :new
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as admin" do
      sign_in { FactoryGirl.create :admin }

      it 'shows the teams index page' do
        get :new
        expect(response).to render_template :new
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'does not allow access' do
        get :new
        expect(response).to redirect_to root_url
      end
    end
  end

end
