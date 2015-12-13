require 'rails_helper'

RSpec.describe NotificationsController, type: :controller do
  describe "GET #index" do
    context "when not signed in" do
      it "redirects to the sign in page" do
        get :index
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in as delegate" do
      let(:delegate) { FactoryGirl.create :delegate }
      let!(:unconfirmed_competition) { FactoryGirl.create :competition, delegates: [delegate], isConfirmed: false, showAtAll: false }
      let!(:confirmed_competition) { FactoryGirl.create :competition, delegates: [delegate], isConfirmed: true, showAtAll: false }
      let!(:visible_competition) { FactoryGirl.create :competition, delegates: [delegate], isConfirmed: true, showAtAll: true }
      before :each do
        sign_in delegate
      end

      it "shows unconfirmed competitions" do
        get :index
        notifications = assigns(:notifications)
        expect(notifications).to eq [
          {
            text: "#{unconfirmed_competition.name} is not confirmed",
            url: edit_competition_path(unconfirmed_competition),
          }
        ]
      end

      it "doesn't duplicate competitions which we are both delegating and organizing" do
        # Add ourselves as an organizer in addition to being a delegate
        # for this competition.
        unconfirmed_competition.organizers << delegate
        unconfirmed_competition.save

        get :index
        notifications = assigns(:notifications)
        expect(notifications).to eq [
          {
            text: "#{unconfirmed_competition.name} is not confirmed",
            url: edit_competition_path(unconfirmed_competition),
          }
        ]
      end

      it "shows WCA ID claims" do
        person = FactoryGirl.create :person
        user = FactoryGirl.create :user
        user.update_attributes!(unconfirmed_wca_id: person.id, delegate_to_handle_wca_id_claim: delegate)

        get :index
        notifications = assigns(:notifications)
        expect(notifications).to eq [
          {
            text: "#{unconfirmed_competition.name} is not confirmed",
            url: edit_competition_path(unconfirmed_competition),
          },
          {
            text: "#{user.email} has claimed WCA ID #{person.id}",
            url: edit_user_path(user.id, anchor: "wca_id"),
          },
        ]
      end
    end

    context "when signed in as a board member" do
      let(:board_member) { FactoryGirl.create :board_member }
      let!(:unconfirmed_competition) { FactoryGirl.create :competition, isConfirmed: false, showAtAll: false }
      let!(:confirmed_competition) { FactoryGirl.create :confirmed_competition, showAtAll: false }
      let!(:visible_confirmed_competition) { FactoryGirl.create :confirmed_competition, showAtAll: true }
      let!(:visible_unconfirmed_competition) { FactoryGirl.create :competition, isConfirmed: false, showAtAll: true }
      before :each do
        sign_in board_member
      end

      it "shows confirmed, but not visible competitions, as well as unconfirmed, but visible competitions" do
        get :index
        notifications = assigns(:notifications)
        expect(notifications).to eq [
          {
            text: "#{confirmed_competition.name} is waiting to be announced",
            url: admin_edit_competition_path(confirmed_competition),
          },
          {
            text: "#{visible_unconfirmed_competition.name} is visible, but unlocked",
            url: admin_edit_competition_path(visible_unconfirmed_competition),
          },
        ]
      end
    end

    context "when signed in as someone without a wca id" do
      let(:user) { FactoryGirl.create :user }
      before :each do
        sign_in user
      end

      it "asks me to request my WCA ID" do
        get :index
        notifications = assigns(:notifications)
        expect(notifications).to eq [
          {
            text: "Connect your WCA ID to your account!",
            url: profile_claim_wca_id_path,
          }
        ]
      end

      context "when already claimed a wca id" do
        it "tells me who is working on it" do
          person = FactoryGirl.create :person
          delegate = FactoryGirl.create :delegate
          user.unconfirmed_wca_id = person.id
          user.delegate_to_handle_wca_id_claim = delegate
          user.save!

          get :index
          notifications = assigns(:notifications)
          expect(notifications).to eq [
            {
              text: "Waiting for #{delegate.name} to assign you WCA ID #{person.id}",
              url: profile_claim_wca_id_path,
            }
          ]
        end
      end
    end
  end
end
