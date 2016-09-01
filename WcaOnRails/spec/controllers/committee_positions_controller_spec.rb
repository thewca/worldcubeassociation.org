# frozen_string_literal: true
require 'rails_helper'

RSpec.describe CommitteePositionsController, type: :controller do
  let!(:committee) { FactoryGirl.create(:committee) }
  let!(:committee_position) { FactoryGirl.create(:committee_position) }
  let!(:committee_position_no_members) { FactoryGirl.create(:committee_position, name: "Committee position with no members") }
  let!(:team_member) { FactoryGirl.create(:team_member) }

  describe "GET #new" do
    context "when not signed in" do
      sign_out

      it 'redirects to the sign in page' do
        get :new, committee_id: committee_position.committee.slug
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as admin" do
      sign_in { FactoryGirl.create(:admin) }

      it 'shows the committee positions new page' do
        get :new, committee_id: committee_position.committee.slug
        expect(response).to render_template :new
      end
    end

    context 'when signed in as a demoted admin' do
      sign_in { FactoryGirl.create :admin_demoted }

      it 'does not allow access' do
        get :new, committee_id: committee_position.committee.slug
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'does not allow access' do
        get :new, committee_id: committee_position.committee.slug
        expect(response).to redirect_to root_url
      end
    end
  end

  describe 'POST #create' do
    context 'when not signed in' do
      it 'redirects to the sign in page' do
        post :create, committee_id: committee.slug, committee_position: {name: "An important position", description: "This is a very important position"}
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'does not allow creation' do
        post :create, committee_id: committee.slug, committee_position: {name: "An important position", description: "This is a very important position"}
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create(:admin) }

      it 'creates a new committee position' do
        post :create, committee_id: committee.slug, committee_position: {name: "An important position", description: "This is a very important position", team_leader: false}
        new_committee_position = CommitteePosition.find_by_committee_id_and_slug(committee.id, "an-important-position")
        expect(response).to redirect_to committee_positions_path(new_committee_position.committee)
        expect(new_committee_position.name).to eq "An important position"
      end
    end

    context 'when signed in as a demoted admin' do
      sign_in { FactoryGirl.create :admin_demoted }

      it 'does not allow creation' do
        post :create, committee_id: committee.slug, committee_position: {name: "An important position", description: "This is a very important position"}
        expect(response).to redirect_to root_url
      end
    end
  end

  describe 'GET #edit' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        get :edit, committee_id: committee_position.committee.slug, id: committee_position.id
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }
      it 'does not allow editing' do
        get :edit, committee_id: committee_position.committee.slug, id: committee_position.id
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'shows the committee edit page' do
        get :edit, committee_id: committee_position.committee.slug, id: committee_position.id
        expect(response).to render_template :edit
      end
    end
  end

  describe 'POST #update' do
    context 'when signed in as a demoted admin' do
      sign_in { FactoryGirl.create :admin_demoted }

      it 'cannot update committee position' do
        patch :update, committee_id: committee_position.committee.id, id: committee_position.id, committee_position: { name: "Hello" }
        expect(response).to redirect_to root_url
        expect(flash[:danger]).to_not be_nil
      end
    end

    context 'when signed in as an admin' do
      let(:admin) { FactoryGirl.create(:admin) }
      before :each do
        sign_in admin
      end

      it 'can change name' do
        patch :update, committee_id: committee_position.committee.id, id: committee_position.id, committee_position: { name: "Hello" }
        expect(response).to redirect_to committee_positions_path(committee_position.committee)
        committee_position.reload
        expect(committee_position.name).to eq "Hello"
      end

      it 'can change description' do
        patch :update, committee_id: committee_position.committee.id, id: committee_position.id, committee_position: { description: "What a great position" }
        expect(response).to redirect_to committee_positions_path(committee_position.committee)
        committee_position.reload
        expect(committee_position.description).to eq "What a great position"
      end
      it 'cannot update slug' do
        original_slug = committee_position.slug
        patch :update, committee_id: committee_position.committee.id, id: committee_position.id, committee_position: { slug: "a-great-new-slug" }
        expect(response).to redirect_to committee_positions_path(committee_position.committee)
        committee_position.reload
        expect(committee_position.slug).to eq original_slug
      end
    end
  end

  describe 'POST #destroy' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        delete :destroy, committee_id: committee_position.committee.id, id: committee_position.id
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'can delete a committee position with no team members' do
        delete :destroy, committee_id: committee_position_no_members.committee.id, id: committee_position_no_members.id
        expect(response).to redirect_to committee_positions_path(committee_position_no_members.committee)
        expect(flash[:success]).to eq "Successfully deleted committee position!"
      end

      it 'cannot delete a committee position with team members' do
        delete :destroy, committee_id: team_member.committee_position.committee_id, id: team_member.committee_position.id
        expect(response).to redirect_to committee_positions_path(team_member.committee_position.committee)
        expect(flash[:error]).to eq "Cannot delete a committee position whilst it still has team members. If you really want to delete this committee position then delete the team members first."
      end
    end
  end
end
