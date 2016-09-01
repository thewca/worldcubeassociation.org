# frozen_string_literal: true
require 'rails_helper'

describe TeamMembersController do
  let(:team_member_to_create) { FactoryGirl.build(:team_member) }
  let!(:team_member) { FactoryGirl.create(:team_member) }

  describe "GET #new" do
    context "when not signed in" do
      sign_out

      it 'redirects to the sign in page' do
        get :new, committee_id: team_member.team.committee.slug, team_id: team_member.team.slug
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as admin" do
      sign_in { FactoryGirl.create(:admin) }

      it 'shows the team_member new page' do
        get :new, committee_id: team_member.team.committee.slug, team_id: team_member.team.slug
        expect(response).to render_template :new
      end
    end

    context 'when signed in as a demoted admin' do
      sign_in { FactoryGirl.create :admin_demoted }

      it 'does not allow access' do
        get :new, committee_id: team_member.team.committee.slug, team_id: team_member.team.slug
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'does not allow access' do
        get :new, committee_id: team_member.team.committee.slug, team_id: team_member.team.slug
        expect(response).to redirect_to root_url
      end
    end
  end

  describe 'POST #create' do
    context 'when not signed in' do
      it 'redirects to the sign in page' do
        post :create, committee_id: team_member_to_create.committee.slug, \
                      team_id: team_member_to_create.team.slug, \
                      team_member: { user_id: team_member_to_create.user_id, \
                                     start_date: team_member_to_create.start_date, \
                                     end_date: team_member_to_create.end_date, \
                                     committee_position_id: team_member_to_create.committee_position_id }
        expect(response).to redirect_to new_user_session_path
      end
    end

    context 'when signed in as a regular user' do
      sign_in { FactoryGirl.create :user }

      it 'does not allow creation' do
        post :create, committee_id: team_member_to_create.committee.slug, \
                      team_id: team_member_to_create.team.slug, \
                      team_member: { user_id: team_member_to_create.user_id, \
                                     start_date: team_member_to_create.start_date, \
                                     end_date: team_member_to_create.end_date, \
                                     committee_position_id: team_member_to_create.committee_position_id }
        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as an admin' do
      sign_in { FactoryGirl.create(:admin) }

      it 'creates a new team member' do
        post :create, committee_id: team_member_to_create.committee.slug, \
                      team_id: team_member_to_create.team.slug, \
                      team_member: { user_id: team_member_to_create.user_id, \
                                     start_date: team_member_to_create.start_date, \
                                     end_date: team_member_to_create.end_date, \
                                     committee_position_id: team_member_to_create.committee_position_id }
        tm = TeamMember.find_by_user_id(team_member_to_create.user_id)
        expect(tm.committee_position_id).to eq team_member_to_create.committee_position_id
        expect(tm.start_date).to eq team_member_to_create.start_date
        expect(response).to redirect_to committee_path(team_member_to_create.team.committee.slug)
      end
    end

    context 'when signed in as a demoted admin' do
      sign_in { FactoryGirl.create :admin_demoted }

      it 'does not allow creation' do
        post :create, committee_id: team_member_to_create.committee.slug, \
                      team_id: team_member_to_create.team.slug, \
                      team_member: { user_id: team_member_to_create.user_id, \
                                     start_date: team_member_to_create.start_date, \
                                     end_date: team_member_to_create.end_date, \
                                     committee_position_id: team_member_to_create.committee_position_id }
        expect(response).to redirect_to root_url
      end
    end
  end

  describe 'GET #edit' do
    context 'when signed in as a team leader without rights to manage all teams' do
      let(:leader) { FactoryGirl.create(:regulations_team_leader) }
      let(:team_leaders_team) { Team.find_by_slug('regulations-team') || FactoryGirl.create(:team, name: 'Regulations Team', committee: Committee.find_by_slug(Committee::WCA_REGULATIONS_COMMITTEE)) }
      let(:other_team) { Team.find_by_slug('software-team') || FactoryGirl.create(:team, name: 'Software Team', committee: Committee.find_by_slug(Committee::WCA_SOFTWARE_COMMITTEE)) }
      let!(:team_member_same_team) { FactoryGirl.create(:team_member, team: team_leaders_team) }
      let!(:team_member_different_team) { FactoryGirl.create(:team_member, team: other_team) }

      before :each do
        sign_in leader
      end

      it 'can edit own team members' do
        get :edit, committee_id: team_leaders_team.committee.slug, team_id: team_leaders_team.slug, id: team_member_same_team.id
        expect(response).to render_template :edit
      end

      it 'cannot edit other teams' do
        get :edit, committee_id: other_team.committee.slug, team_id: other_team.slug, id: team_member_different_team.id
        expect(response).to redirect_to root_url
        expect(flash[:danger]).to_not be_nil
      end
    end
  end

  describe 'POST #update' do
    context 'when signed in as a demoted admin' do
      sign_in { FactoryGirl.create :admin_demoted }

      it 'cannot update team members' do
        patch :update, committee_id: team_member.team.committee.slug, team_id: team_member.team.slug, id: team_member.id, team_member: {end_date: '2016-01-01'}
        expect(response).to redirect_to root_url
        expect(flash[:danger]).to_not be_nil
      end
    end

    context 'when signed in as an admin' do
      let(:admin) { FactoryGirl.create(:admin) }
      before :each do
        sign_in admin
      end

      it 'can change start date' do
        patch :update, committee_id: team_member.team.committee.slug, team_id: team_member.team.slug, id: team_member.id, team_member: {start_date: '2016-01-01'}
        expect(response).to redirect_to committee_path(team_member.committee.slug)
        team_member.reload
        expect(team_member.start_date.to_s).to eq "2016-01-01"
      end

      it 'cannot change user' do
        original_user_id = team_member.user_id
        new_user_id = original_user_id + 1
        patch :update, committee_id: team_member.team.committee.slug, team_id: team_member.team.slug, id: team_member.id, team_member: {user_id: new_user_id}
        expect(response).to redirect_to committee_path(team_member.committee.slug)
        team_member.reload
        expect(team_member.user_id).to eq original_user_id
      end
    end
  end
end
