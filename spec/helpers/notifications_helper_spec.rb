# frozen_string_literal: true

require 'rails_helper'

RSpec.describe NotificationsHelper do
  describe "#notifications_for_user" do
    context "when delegate" do
      let(:delegate) { FactoryBot.create :delegate }

      context "with some unconfirmed competitions" do
        let!(:unconfirmed_competition) { FactoryBot.create :competition, delegates: [delegate] }
        let!(:confirmed_competition) { FactoryBot.create :competition, :confirmed, delegates: [delegate] }

        it "does not show unconfirmed competitions" do
          notifications = helper.notifications_for_user(delegate)
          expect(notifications).to eq []
        end
      end

      it "shows WCA ID claims for confirmed accounts, but not for unconfirmed accounts" do
        person = FactoryBot.create :person
        user = FactoryBot.create :user
        user.update!(unconfirmed_wca_id: person.wca_id, delegate_to_handle_wca_id_claim: delegate, dob_verification: person.dob)

        unconfirmed_user = FactoryBot.create :user, confirmed: false
        unconfirmed_user.update!(unconfirmed_wca_id: person.wca_id, delegate_to_handle_wca_id_claim: delegate, dob_verification: person.dob)

        notifications = helper.notifications_for_user(delegate)
        expect(notifications).to eq [
          {
            text: "#{user.email} has claimed WCA ID #{person.wca_id}",
            url: edit_user_path(user.id, anchor: "wca_id"),
          },
        ]
      end

      context "have delegated competitions that are missing reports" do
        let!(:past_competition_missing_report) { FactoryBot.create :competition, :past, :visible, :confirmed, delegates: [delegate] }
        let!(:past_competition_having_report) { FactoryBot.create :competition, :past, :visible, :confirmed, :with_delegate_report, delegates: [delegate] }
        let!(:future_competition) { FactoryBot.create :competition, :future, :visible, :confirmed, delegates: [delegate] }

        it "asks me to submit the reports" do
          notifications = helper.notifications_for_user(delegate)
          expect(notifications).to eq [
            {
              text: "The delegate report for #{past_competition_missing_report.name} has not been submitted.",
              url: delegate_report_path(past_competition_missing_report),
            },
            {
              text: "The competition results for #{past_competition_missing_report.name} have not been submitted.",
              url: competition_submit_results_edit_path(past_competition_missing_report),
            },
            {
              text: "The competition results for #{past_competition_having_report.name} have not been submitted.",
              url: competition_submit_results_edit_path(past_competition_having_report),
            },
          ]
        end
      end
    end

    context "when signed in as a WCAT member" do
      let(:wcat_member) { FactoryBot.create :user, :wcat_member, :wca_id }
      let!(:unconfirmed_competition) { FactoryBot.create :competition }
      let!(:confirmed_competition) { FactoryBot.create(:competition, :confirmed) }
      let!(:visible_confirmed_competition) { FactoryBot.create(:competition, :confirmed, :visible) }
      let!(:visible_unconfirmed_competition) { FactoryBot.create :competition, :visible }

      it "shows confirmed, but not visible competitions, as well as unconfirmed, but visible competitions" do
        notifications = helper.notifications_for_user(wcat_member)
        expect(notifications).to eq [
          {
            text: "#{confirmed_competition.name} is pending announcement. The competition is happening in #{confirmed_competition.days_until} days.",
            url: competition_admin_edit_path(confirmed_competition),
          },
          {
            text: "#{visible_unconfirmed_competition.name} is visible, but unlocked",
            url: competition_admin_edit_path(visible_unconfirmed_competition),
          },
        ]
      end
    end

    context "when signed in as someone without a wca id" do
      let(:user) { FactoryBot.create :user }

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
          person = FactoryBot.create :person
          delegate = FactoryBot.create :delegate
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
