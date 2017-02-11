# frozen_string_literal: true
require 'rails_helper'

RSpec.describe NotificationsHelper do
  describe "#notifications_for_user" do
    context "when delegate" do
      let(:delegate) { FactoryGirl.create :delegate }
      let!(:unconfirmed_competition) { FactoryGirl.create :competition, delegates: [delegate] }
      let!(:confirmed_competition) { FactoryGirl.create :competition, delegates: [delegate], isConfirmed: true }

      it "shows unconfirmed competitions" do
        notifications = helper.notifications_for_user(delegate)
        expect(notifications).to eq [
          {
            text: "#{unconfirmed_competition.name} is not confirmed",
            url: edit_competition_path(unconfirmed_competition),
          },
        ]
      end

      it "doesn't duplicate competitions which we are both delegating and organizing" do
        # Add ourselves as an organizer in addition to being a delegate
        # for this competition.
        unconfirmed_competition.organizers << delegate
        unconfirmed_competition.save

        notifications = helper.notifications_for_user(delegate)
        expect(notifications).to eq [
          {
            text: "#{unconfirmed_competition.name} is not confirmed",
            url: edit_competition_path(unconfirmed_competition),
          },
        ]
      end

      it "shows WCA ID claims for confirmed accounts, but not for unconfirmed accounts" do
        person = FactoryGirl.create :person
        user = FactoryGirl.create :user
        user.update_attributes!(unconfirmed_wca_id: person.wca_id, delegate_to_handle_wca_id_claim: delegate, dob_verification: person.dob)

        unconfirmed_user = FactoryGirl.create :user, :unconfirmed
        unconfirmed_user.update_attributes!(unconfirmed_wca_id: person.wca_id, delegate_to_handle_wca_id_claim: delegate, dob_verification: person.dob)

        notifications = helper.notifications_for_user(delegate)
        expect(notifications).to eq [
          {
            text: "#{unconfirmed_competition.name} is not confirmed",
            url: edit_competition_path(unconfirmed_competition),
          },
          {
            text: "#{user.email} has claimed WCA ID #{person.wca_id}",
            url: edit_user_path(user.id, anchor: "wca_id"),
          },
        ]
      end
    end

    context "when signed in as a board member" do
      let(:board_member) { FactoryGirl.create :board_member }
      let!(:unconfirmed_competition) { FactoryGirl.create :competition }
      let!(:confirmed_competition) { FactoryGirl.create(:competition, :confirmed) }
      let!(:visible_confirmed_competition) { FactoryGirl.create(:competition, :confirmed, :visible) }
      let!(:visible_unconfirmed_competition) { FactoryGirl.create :competition, :visible }

      it "shows confirmed, but not visible competitions, as well as unconfirmed, but visible competitions" do
        notifications = helper.notifications_for_user(board_member)
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

      it "asks me to request my WCA ID" do
        notifications = helper.notifications_for_user(user)
        expect(notifications).to eq [
          {
            text: "Connect your WCA ID to your account!",
            url: profile_claim_wca_id_path,
          },
        ]
      end

      it "asks me to complete my profile before registering for a competition" do
        user.dob = nil
        user.save!

        notifications = helper.notifications_for_user(user)
        expect(notifications).to eq [
          {
            text: "Connect your WCA ID to your account!",
            url: profile_claim_wca_id_path,
          },
          {
            text: "Your profile is incomplete. You will not be able to register for competitions until you complete it!",
            url: profile_edit_path,
          },
        ]
      end

      context "when already claimed a wca id" do
        it "tells me who is working on it" do
          person = FactoryGirl.create :person
          delegate = FactoryGirl.create :delegate
          user.unconfirmed_wca_id = person.wca_id
          user.delegate_to_handle_wca_id_claim = delegate
          user.dob_verification = person.dob
          user.save!

          notifications = helper.notifications_for_user(user)
          expect(notifications).to eq [
            {
              text: "Waiting for #{delegate.name} to assign you WCA ID #{person.wca_id}",
              url: profile_claim_wca_id_path,
            },
          ]
        end
      end
    end
  end
end
