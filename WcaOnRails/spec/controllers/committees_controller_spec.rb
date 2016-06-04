require 'rails_helper'

RSpec.describe CommitteesController, type: :controller do
  let(:committee) { FactoryGirl.create :committee }
  let(:committee_with_team) { FactoryGirl.create :committee, :with_team }

  describe "GET #index" do
    context "when not signed in" do
      sign_out

      it 'shows the committee index page' do
        get :index
        expect(response).to render_template :index
      end
    end

    context "when signed in as admin" do
      sign_in { FactoryGirl.create :admin }

      it 'shows the committee index page' do
        get :index
        expect(response).to render_template :index
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'shows the committee index page' do
        get :index
        expect(response).to render_template :index
      end
    end
  end

  describe "GET #show" do
    context "when not signed in" do
      sign_out

      it 'displays the committee show page' do
        get :show, id: committee.slug
        expect(response).to render_template :show
      end
    end

    context "when signed in as admin" do
      sign_in { FactoryGirl.create :admin }

      it 'displays the committee show page' do
        get :show, id: committee.slug
        expect(response).to render_template :show
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'displays the committee show page' do
        get :show, id: committee.slug
        expect(response).to render_template :show
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

      it 'shows the committee new page' do
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

  describe 'POST #create' do
    context "when not signed in" do
      sign_out

      it 'redirects to the sign in page' do
        post :create, committee: { name: "Software", email: "software@worldcubeassociation.org", duties: "Responsible for all WCA software" }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }
      it 'does not allow creation' do
        post :create, committee: { name: "Software", email: "software@worldcubeassociation.org", duties: "Responsible for all WCA software" }
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'creates a new committee' do
        post :create, committee: { name: "Software", email: "software@worldcubeassociation.org", duties: "Responsible for all WCA software" }
        new_committee = Committee.find_by_name("Software")
        expect(response).to redirect_to committee_path(new_committee.slug)
        expect(new_committee.name).to eq "Software"
        expect(new_committee.slug).to eq "software"
        expect(new_committee.duties).to eq "Responsible for all WCA software"
      end
    end
  end

  describe 'GET #edit' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :edit, id: committee.slug
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }
      it 'does not allow editing' do
        get :edit, id: committee.slug
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'shows the committee edit page' do
        get :edit, id: committee.slug
        expect(response).to render_template :edit
      end
    end
  end

  describe 'POST #update' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        patch :update, id: committee, committee: { name: "Rails Software" }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      let(:admin) { FactoryGirl.create :admin }
      before :each do
        sign_in admin
      end

      it 'can update name' do
        patch :update, id: committee, committee: { name: "Rails Software" }
        committee.reload
        expect(response).to redirect_to committee_path(committee.slug)
        expect(committee.name).to eq "Rails Software"
      end

      it 'can update duties' do
        patch :update, id: committee, committee: { duties: "No responsibility" }
        expect(response).to redirect_to committee_path(committee.slug)
        committee.reload
        expect(committee.duties).to eq "No responsibility"
      end

      it 'cannot update slug' do
        original_slug = committee.slug
        patch :update, id: committee, committee: { slug: "no-changes-allowed" }
        expect(response).to redirect_to committee_path(committee.slug)
        committee.reload
        expect(committee.slug).to eq original_slug
      end
    end
  end

  describe 'POST #destroy' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        delete :destroy, id: committee
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'can delete a committee with no teams' do
        delete :destroy, id: committee
        expect(response).to redirect_to committees_path
        expect(flash[:success]).to eq "Successfully deleted committee!"
      end

      it 'cannot delete a committee with teams' do
        delete :destroy, id: committee_with_team
        expect(response).to redirect_to committee_path(committee_with_team.slug)
        expect(flash[:error]).to eq "Cannot delete a committee whilst it still has teams. If you really want to delete this committee then delete the teams first."
      end
    end
  end
end
