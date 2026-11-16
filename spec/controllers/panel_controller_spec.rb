# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PanelController do
  describe "signed in as senior delegate" do
    let!(:senior_delegate_role) { create(:senior_delegate_role) }

    before :each do
      sign_in senior_delegate_role.user
    end

    it "can view the pending claims for subordinate delegates" do
      get :pending_claims_for_subordinate_delegates
      expect(response).to have_http_status :ok
    end
  end

  describe "signed in as board member" do
    let!(:board_member) { create(:user, :board_member) }

    before :each do
      sign_in board_member
    end

    it "can view the pending claims for subordinate delegates of senior delegates" do
      get :pending_claims_for_subordinate_delegates
      expect(response).to have_http_status :ok
    end
  end

  describe "validator actions" do
    let(:competition) { create(:competition, :past, :announced) }
    let(:validator_params) { { selectedValidators: ResultsValidators::PositionsValidator.class_name, checkRealResults: true } }

    context "when signed in as a regular user" do
      before { sign_in create(:user) }

      it "cannot count competitions in a range" do
        get :competition_count, params: { startDate: "2020-01-01", endDate: "2020-12-31" }

        expect(response).to redirect_to root_url
      end

      it "cannot run validators for a range" do
        get :validators_for_competitions_in_range, params: { startDate: "2020-01-01", endDate: "2020-12-31", applyFixWhenPossible: false, **validator_params }

        expect(response).to redirect_to root_url
      end

      it "cannot run validators for a competition" do
        get :validators_for_competition_list, params: { competitionIds: competition.id, applyFixWhenPossible: false, **validator_params }

        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a delegate of the competition" do
      before { sign_in competition.delegates.first }

      it "can run validators for their competition" do
        get :validators_for_competition_list, params: { competitionIds: competition.id, applyFixWhenPossible: false, **validator_params }

        expect(response).to have_http_status :ok
      end

      it "cannot apply fixes for their competition" do
        get :validators_for_competition_list, params: { competitionIds: competition.id, applyFixWhenPossible: true, **validator_params }

        expect(response).to redirect_to root_url
      end

      it "cannot run validators for another competition" do
        other_competition = create(:competition, :past, :announced)

        get :validators_for_competition_list, params: { competitionIds: "#{competition.id},#{other_competition.id}", applyFixWhenPossible: false, **validator_params }

        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as a results team member" do
      before { sign_in create(:user, :wrt_member) }

      it "can apply fixes for any competition" do
        get :validators_for_competition_list, params: { competitionIds: competition.id, applyFixWhenPossible: true, **validator_params }

        expect(response).to have_http_status :ok
      end

      it "can count competitions in a range" do
        get :competition_count, params: { startDate: "2020-01-01", endDate: "2020-12-31" }

        expect(response).to have_http_status :ok
      end
    end
  end

  describe "cronjob actions" do
    context "when signed in as a regular user" do
      before { sign_in create(:user) }

      it "cannot view cronjob details" do
        get :cronjob_details, params: { cronjob_name: UnstickPosts.name }

        expect(response).to redirect_to root_url
      end

      it "cannot run a cronjob" do
        expect do
          post :cronjob_run, params: { cronjob_name: UnstickPosts.name }
        end.not_to have_enqueued_job(UnstickPosts)

        expect(response).to redirect_to root_url
      end

      it "cannot reset a cronjob" do
        UnstickPosts.cronjob_statistics.update!(recently_errored: 1, last_error_message: "Something broke")

        post :cronjob_reset, params: { cronjob_name: UnstickPosts.name }

        expect(response).to redirect_to root_url
        expect(UnstickPosts.last_error_message).to eq "Something broke"
      end
    end

    context "when signed in as a results team member" do
      before { sign_in create(:user, :wrt_member) }

      it "can run a cronjob" do
        expect do
          post :cronjob_run, params: { cronjob_name: UnstickPosts.name }
        end.to have_enqueued_job(UnstickPosts)

        expect(response).to have_http_status :ok
      end
    end
  end
end
