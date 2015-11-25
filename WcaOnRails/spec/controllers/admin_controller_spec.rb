require 'rails_helper'

RSpec.describe AdminController, type: :controller do
  describe 'GET #index' do
    context 'when not signed in' do
      it 'redirects to the sign in page' do
        get :index
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a delegate' do
      sign_in { FactoryGirl.create :delegate }

      it 'redirects to the root page' do
        get :index
        expect(response).to redirect_to root_path
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'shows the index page' do
        get :index
        expect(response).to render_template :index
      end
    end
  end

  describe 'merge_people' do
    sign_in { FactoryGirl.create :admin }

    let(:person1) { FactoryGirl.create(:person) }
    let(:person2) { FactoryGirl.create(:person,
                                       name: person1.name,
                                       countryId: person1.countryId,
                                       gender: person1.gender,
                                       year: person1.year,
                                       month: person1.month,
                                       day: person1.day)
    }

    it 'can merge people' do
      post :do_merge_people, merge_people: { person1_wca_id: person1.wca_id, person2_wca_id: person2.wca_id }
      expect(response.status).to eq 200
      expect(response).to render_template :merge_people
      expect(flash.now[:success]).to eq "Successfully merged #{person2.wca_id} into #{person1.wca_id}!"
    end
  end
end
