# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TeamsController do
  let(:team) { FactoryBot.create :team }

  describe 'GET #edit' do
    it "leader of WDC can manage the banned team, despite not being a member of the banned team" do
      sign_in FactoryBot.create :user, :wdc_leader

      get :edit, params: { id: Team.banned.id }
      expect(response).to render_template :edit
    end
  end

  describe 'POST #update' do
    context 'when signed in as an admin' do
      let!(:admin) { FactoryBot.create :admin }
      before :each do
        sign_in admin
      end

      it 'cannot change friendly ID' do
        patch :update, params: { id: team, team: { friendly_id: "bestteam" } }
        expect(response).to redirect_to edit_team_path(team)
        expect(team.reload.friendly_id).to_not eq "bestteam"
      end

      it 'can add a member' do
        member = FactoryBot.create :user
        patch :update, params: { id: team, team: { team_members_attributes: { "0" => { user_id: member.id, start_date: Date.today, team_leader: false } } } }
        expect(response).to redirect_to edit_team_path(team)
        team.reload
        expect(team.team_members.first.user.id).to eq member.id
      end

      it 'can deactivate a member' do
        other_member = FactoryBot.create :user
        patch :update, params: { id: team, team: { team_members_attributes: { "0" => { user_id: other_member.id, start_date: Date.today-2, team_leader: false } } } }
        expect(response).to redirect_to edit_team_path(team)
        team.reload
        new_member = team.team_members.first
        patch :update, params: { id: team, team: { team_members_attributes: { "0" => { id: new_member.id, user_id: other_member.id, start_date: new_member.start_date, end_date: Date.today-1, team_leader: false } } } }
        team.reload
        expect(team.team_members.first.current_member?).to be false
      end

      it 'cannot set start_date < end_date' do
        member = FactoryBot.create :user
        patch :update, params: { id: team, team: { team_members_attributes: { "0" => { user_id: member.id, start_date: Date.today, end_date: Date.today-1, team_leader: false } } } }
        invalid_team = assigns(:team)
        expect(invalid_team).to be_invalid
      end

      it 'cannot ban a user with non-deleted registrations of upcoming competitions' do
        team = Team.banned
        member = FactoryBot.create :user
        competition = FactoryBot.create :competition, :future
        FactoryBot.create :registration, user_id: member.id, competition_id: competition.id
        patch :update, params: { id: team, team: { team_members_attributes: { "0" => { user_id: member.id, start_date: Date.today, team_leader: false } } } }
        invalid_team = assigns(:team)
        expect(invalid_team).to be_invalid
      end

      it 'can ban a user with deleted registrations of upcoming competitions' do
        team = Team.banned
        member = FactoryBot.create :user
        competition = FactoryBot.create :competition, :future
        FactoryBot.create :registration, :deleted, user_id: member.id, competition_id: competition.id
        patch :update, params: { id: team, team: { team_members_attributes: { "0" => { user_id: member.id, start_date: Date.today, team_leader: false } } } }
        expect(response).to redirect_to edit_team_path(team)
        team.reload
        expect(team.team_members.first.user.id).to eq member.id
      end

      it 'cannot add overlapping membership periods for the same user' do
        member = FactoryBot.create :user
        patch :update, params: {
          id: team,
          team: {
            team_members_attributes: {
              "0" => { user_id: member.id, start_date: Date.today, end_date: Date.today+10, team_leader: false },
              "1" => { user_id: member.id, start_date: Date.today+9, end_date: Date.today+20, team_leader: false },
            },
          },
        }
        invalid_team = assigns(:team)
        expect(invalid_team).to be_invalid
      end

      it 'cannot add another membership for the same user without start_date' do
        member = FactoryBot.create :user
        patch :update, params: {
          id: team,
          team: {
            team_members_attributes: {
              "0" => { user_id: member.id, start_date: Date.today+10, end_date: Date.today+5 },
              "1" => { user_id: member.id, start_date: nil, end_date: Date.today+10 },
            },
          },
        }
        expect(team.reload.team_members.count).to eq 0
      end

      it 'cannot add a membership with end_date but without start_date' do
        member = FactoryBot.create :user
        patch :update, params: { id: team, team: { team_members_attributes: { "0" => { user_id: member.id, start_date: nil, end_date: Date.today+5 } } } }
        expect(team.reload.team_members.count).to eq 0
      end
    end

    context "leader of WDC managing the banned team, despite not being a member of the banned team" do
      sign_in { FactoryBot.create :user, :wdc_leader }

      it 'can add a member' do
        team = Team.banned
        member = FactoryBot.create :user
        patch :update, params: { id: team, team: { team_members_attributes: { "0" => { user_id: member.id, start_date: Date.today, team_leader: false } } } }
        expect(response).to redirect_to edit_team_path(team)
        expect(team.reload.team_members.first.user.id).to eq member.id
      end
    end
  end
end
