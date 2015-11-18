require 'rails_helper'

RSpec.describe AdminController, type: :controller do
  describe 'GET #index' do
    context 'when not signed in' do
      it 'redirects to the sign in page' do
        get :index
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'shows the index page' do
        get :index
        expect(response).to render_template :index
      end
    end

    context 'when signed in as a delegate' do
      sign_in { FactoryGirl.create :delegate }

      it 'redirects to the root page' do
        get :index
        expect(response).to redirect_to root_path
      end
    end
  end
end
