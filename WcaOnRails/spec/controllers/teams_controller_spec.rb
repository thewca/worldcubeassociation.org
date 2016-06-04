# frozen_string_literal: true
require 'rails_helper'

describe TeamsController do
  let!(:team) { FactoryGirl.create(:team) }
  let!(:team_to_delete) { FactoryGirl.create(:team, name: "No members") }
  let!(:team_to_delete_with_member) { FactoryGirl.create(:team, :with_team_member, name: "Team with a member") }

  describe "GET #new" do
    context "when not signed in" do
      sign_out

      it 'redirects to the sign in page' do
        get :new, committee_id: team.committee.slug
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as admin" do
      sign_in { FactoryGirl.create(:admin) }

      it 'shows the teams new page' do
        get :new, committee_id: team.committee.slug
        expect(response).to render_template :new
      end
    end

    context 'when signed in as a demoted admin' do
      sign_in { FactoryGirl.create :admin_demoted }

      it 'does not allow access' do
        get :new, committee_id: team.committee.slug
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'does not allow access' do
        get :new, committee_id: team.committee.slug
        expect(response).to redirect_to root_url
      end
    end
  end

  describe 'POST #create' do
    context 'when not signed in' do
      it 'redirects to the sign in page' do
        post :create, committee_id: team.committee.slug, team: {name: "Team 2016", description: "An important team for 2016"}
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'does not allow creation' do
        post :create, committee_id: team.committee.slug, team: {name: "Team 2016", description: "An important team for 2016"}
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create(:admin) }

      it 'creates a new team' do
        post :create, committee_id: team.committee.slug, team: {name: "Team 2016", description: "An important team for 2016"}
        new_team = Team.find_by_name("Team 2016")
        expect(response).to redirect_to committee_path(team.committee.slug)
        expect(new_team.name).to eq "Team 2016"
      end
    end

    context 'when signed in as a demoted admin' do
      sign_in { FactoryGirl.create :admin_demoted }

      it 'does not allow creation' do
        post :create, committee_id: team.committee.slug, team: {name: "Team 2016", description: "An important team for 2016"}
        expect(response).to redirect_to root_url
      end
    end
  end

  describe 'GET #edit' do
    context 'when signed in as a team leader without rights to manage all teams' do
      let(:leader) { FactoryGirl.create(:regulations_team_leader) }
      let(:team_where_is_leader) { Team.find_by_slug('regulations-team') || FactoryGirl.create(:team, name: 'Regulations Team', committee: Committee.find_by_slug(Committee::WCA_REGULATIONS_COMMITTEE)) }
      let(:team_where_is_not_leader) { Team.find_by_slug('software-team') || FactoryGirl.create(:team, name: 'Software Team', committee: Committee.find_by_slug(Committee::WCA_SOFTWARE_COMMITTEE)) }

      before :each do
        sign_in leader
      end

      it 'can edit his team' do
        get :edit, committee_id: team_where_is_leader.committee.slug, id: team_where_is_leader.slug
        expect(response).to render_template :edit
      end

      it 'cannot edit other teams' do
        get :edit, committee_id: team_where_is_not_leader.committee.slug, id: team_where_is_not_leader.slug
        expect(response).to redirect_to root_url
        expect(flash[:danger]).to_not be_nil
      end
    end
  end

  describe 'POST #update' do
    context 'when signed in as a demoted admin' do
      sign_in { FactoryGirl.create :admin_demoted }

      it 'cannot update teams' do
        patch :update, committee_id: team.committee.slug, id: team.slug, team: { name: "Hello" }
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
        patch :update, committee_id: team.committee.slug, id: team.slug, team: { name: "Hello" }
        expect(response).to redirect_to committee_path(team.committee.slug)
        team.reload
        expect(team.name).to eq "Hello"
      end

      it 'can change description' do
        patch :update, committee_id: team.committee.slug, id: team.slug, team: { description: "This team is the best!" }
        expect(response).to redirect_to committee_path(team.committee.slug)
        team.reload
        expect(team.description).to eq "This team is the best!"
      end

      it 'cannot change slug' do
        original_slug = team.slug
        patch :update, committee_id: team.committee.slug, id: team.slug, team: { slug: "no-changes-allowed" }
        expect(response).to redirect_to committee_path(team.committee.slug)
        team.reload
        expect(team.slug).to eq original_slug
      end
    end
  end

  describe 'POST #destroy' do
    context 'when not signed in' do
      sign_out

      it 'redirects to the sign in page' do
        delete :destroy, committee_id: team.committee.slug, id: team.slug
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create :admin }

      it 'can delete a team with no team members' do
        delete :destroy, committee_id: team_to_delete.committee.slug, id: team_to_delete.slug
        expect(response).to redirect_to committee_path(team_to_delete.committee.slug)
        expect(flash[:success]).to eq "Successfully deleted team!"
      end

      it 'cannot delete a team with team members' do
        delete :destroy, committee_id: team_to_delete_with_member.committee.slug, id: team_to_delete_with_member.slug
        expect(response).to redirect_to committee_path(team_to_delete_with_member.committee.slug)
        expect(flash[:error]).to eq "Cannot delete a team whilst it still has team members. If you really want to delete this team then delete the team members first."
      end
    end
  end
end
