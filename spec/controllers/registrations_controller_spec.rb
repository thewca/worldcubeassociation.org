# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RegistrationsController, clean_db_with_truncation: true do
  context "signed in as organizer" do
    let!(:organizer) { FactoryBot.create(:user) }
    let(:competition) { FactoryBot.create(:competition, :registration_open, :visible, organizers: [organizer], events: Event.where(id: %w(222 333))) }
    let(:zzyzx_user) { FactoryBot.create :user, name: "Zzyzx" }
    let(:registration) { FactoryBot.create(:registration, competition: competition, user: zzyzx_user) }

    before :each do
      sign_in organizer
    end

    it 'allows access to competition organizer' do
      get :index, params: { competition_id: competition }
      expect(response.status).to eq 200
    end

    it 'cannot set events that are not offered' do
      three_by_three = Event.find("333")
      competition.events = [three_by_three]

      patch :update, params: { id: registration.id, registration: { registration_competition_events_attributes: [{ competition_event_id: competition.competition_events.first.id }, { competition_event_id: -2342 }] } }
      registration.reload
      expect(registration.events).to match_array [three_by_three]
    end

    it 'cannot change registration of a different competition' do
      other_competition = FactoryBot.create(:competition, :confirmed, :visible, :registration_open)
      other_registration = FactoryBot.create(:registration, competition: other_competition)

      patch :update, params: { id: other_registration.id, registration: { accepted_at: Time.now } }
      expect(other_registration.reload.pending?).to eq true
      expect(flash[:danger]).to eq "Could not update registration"
    end

    it "accepts a pending registration" do
      expect(RegistrationsMailer).to receive(:notify_registrant_of_accepted_registration).with(registration).and_call_original
      expect do
        patch :update, params: { id: registration.id, registration: { status: 'accepted' } }
      end.to change { enqueued_jobs.size }.by(1)
      expect(registration.reload.accepted?).to be true
      expect(registration.accepted_user).to eq organizer
    end

    it "changes an accepted registration to pending" do
      registration.update!(accepted_at: Time.now)

      expect(RegistrationsMailer).to receive(:notify_registrant_of_pending_registration).with(registration).and_call_original
      expect do
        patch :update, params: { id: registration.id, registration: { accepted_at: nil, updated_at: registration.updated_at }, from_admin_view: true }
      end.to change { enqueued_jobs.size }.by(1)
      expect(registration.reload.pending?).to be true
      expect(response).to redirect_to edit_registration_path(registration)
    end

    it "doesn't update accepted_at when status doesn't change" do
      registration.update!(accepted_at: Time.now)
      expect do
        patch :update, params: { id: registration.id, registration: { comments: "A new comment.", status: "accepted" } }
      end.to_not change { registration.reload.accepted_at }
    end

    it "can delete registration" do
      expect(RegistrationsMailer).to receive(:notify_registrant_of_deleted_registration).with(registration).and_call_original

      delete :destroy, params: { id: registration.id }

      expect(flash[:success]).to eq "Deleted registration and emailed #{registration.email}"
      expect(Registration.find_by_id(registration.id).deleted?).to eq true
    end

    it "can delete multiple registrations" do
      registration2 = FactoryBot.create(:registration, competition: competition)

      expect(RegistrationsMailer).to receive(:notify_registrant_of_deleted_registration).with(registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_deleted_registration).with(registration2).and_call_original

      expect do
        patch :do_actions_for_selected, params: {
          competition_id: competition.id,
          registrations_action: "delete-selected",
          selected_registrations: ["registration-#{registration.id}", "registration-#{registration2.id}"],
        }, xhr: true
      end.to change { enqueued_jobs.size }.by(2)

      expect(Registration.find_by_id(registration.id).deleted?).to eq true
      expect(Registration.find_by_id(registration2.id).deleted?).to eq true
    end

    it "can reject multiple registrations" do
      registration.update!(accepted_at: Time.now)
      registration2 = FactoryBot.create(:registration, :accepted, competition: competition)
      pending_registration = FactoryBot.create(:registration, :pending, competition: competition)

      expect(RegistrationsMailer).to receive(:notify_registrant_of_pending_registration).with(registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_pending_registration).with(registration2).and_call_original
      # We shouldn't notify people who were already on the waiting list that they're
      # still on the waiting list.
      expect(RegistrationsMailer).not_to receive(:notify_registrant_of_pending_registration).with(pending_registration).and_call_original
      expect do
        patch :do_actions_for_selected, params: {
          competition_id: competition.id,
          registrations_action: "reject-selected",
          selected_registrations: ["registration-#{registration.id}", "registration-#{registration2.id}", "registration-#{pending_registration.id}"],
        }, xhr: true
      end.to change { enqueued_jobs.size }.by(2)
      expect(registration.reload.pending?).to be true
      expect(registration2.reload.pending?).to be true
      expect(pending_registration.reload.pending?).to be true
    end

    it "can accept multiple registrations" do
      registration2 = FactoryBot.create(:registration, competition: competition)
      accepted_registration = FactoryBot.create(:registration, :accepted, competition: competition)

      expect(RegistrationsMailer).to receive(:notify_registrant_of_accepted_registration).with(registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_accepted_registration).with(registration2).and_call_original
      # We shouldn't notify people who were already accepted that they're
      # still accepted.
      expect(RegistrationsMailer).not_to receive(:notify_registrant_of_accepted_registration).with(accepted_registration).and_call_original
      expect do
        patch :do_actions_for_selected, params: {
          competition_id: competition.id,
          registrations_action: "accept-selected",
          selected_registrations: ["registration-#{registration.id}", "registration-#{registration2.id}", "registration-#{accepted_registration.id}"],
        }, xhr: true
      end.to change { enqueued_jobs.size }.by(2)
      expect(registration.reload.accepted?).to be true
      expect(registration2.reload.accepted?).to be true
      expect(accepted_registration.reload.accepted?).to be true
    end

    it "doesn't allow accepting a Competition Series two-timer" do
      two_timer_dave = FactoryBot.create(:user, :wca_id, name: "Two Timer Dave")

      series = FactoryBot.create(:competition_series)
      competition.update!(competition_series: series)

      partner_competition = FactoryBot.create(:competition, :with_delegate, :visible, event_ids: %w(333 444),
                                                                                      competition_series: series, series_base: competition)

      # make sure there is a dummy registration for the partner competition.
      FactoryBot.create(:registration, :accepted, competition: partner_competition, user: two_timer_dave)

      registration2 = FactoryBot.create(:registration, :pending, competition: competition, user: two_timer_dave)

      expect do
        patch :do_actions_for_selected, params: {
          competition_id: competition.id,
          registrations_action: "accept-selected",
          selected_registrations: ["registration-#{registration.id}", "registration-#{registration2.id}"],
        }, xhr: true
      end.to change { enqueued_jobs.size }.by(1)
      expect(registration.reload.accepted?).to be true
      expect(registration2.reload.accepted?).to be false
      expect(flash[:danger]).to include I18n.t('registrations.errors.series_more_than_one_accepted')
    end

    it "doesn't allow accepting a banned user" do
      registration.update!(accepted_at: Time.now)
      registration2 = FactoryBot.create(:registration, :pending, competition: competition)
      deleted_registration = FactoryBot.create(:registration, :cancelled, competition: competition)
      banned_deleted_registration = FactoryBot.create(:registration, :cancelled, competition: competition)
      banned_user = FactoryBot.create(:user, :banned)
      banned_deleted_registration.update!(user: banned_user)

      expect do
        patch :do_actions_for_selected, params: {
          competition_id: competition.id,
          registrations_action: "accept-selected",
          selected_registrations: ["registration-#{registration.id}", "registration-#{registration2.id}",
                                   "registration-#{deleted_registration.id}", "registration-#{banned_deleted_registration.id}"],
        }, xhr: true
      end.to change { enqueued_jobs.size }.by(2)
      expect(registration.reload.accepted?).to be true
      expect(registration2.reload.accepted?).to be true
      expect(deleted_registration.reload.accepted?).to be true
      expect(banned_deleted_registration.reload.deleted?).to be true
      expect(flash[:danger]).to include I18n.t('registrations.errors.undelete_banned')
    end

    it "doesn't allow rejecting a banned user" do
      registration.update!(accepted_at: Time.now)
      registration2 = FactoryBot.create(:registration, :pending, competition: competition)
      deleted_registration = FactoryBot.create(:registration, :cancelled, competition: competition)
      banned_deleted_registration = FactoryBot.create(:registration, :cancelled, competition: competition)
      banned_user = FactoryBot.create(:user, :banned)
      banned_deleted_registration.update!(user: banned_user)

      expect do
        patch :do_actions_for_selected, params: {
          competition_id: competition.id,
          registrations_action: "reject-selected",
          selected_registrations: ["registration-#{registration.id}", "registration-#{registration2.id}",
                                   "registration-#{deleted_registration.id}", "registration-#{banned_deleted_registration.id}"],
        }, xhr: true
      end.to change { enqueued_jobs.size }.by(2)
      expect(registration.reload.pending?).to be true
      expect(registration2.reload.pending?).to be true
      expect(deleted_registration.reload.pending?).to be true
      expect(banned_deleted_registration.reload.deleted?).to be true
      expect(flash[:danger]).to include I18n.t('registrations.errors.undelete_banned')
    end

    it "can edit administrative notes on registration" do
      patch :update, params: { id: registration.id, registration: { administrative_notes: "admin notes" } }
      expect(registration.reload.administrative_notes).to eq "admin notes"
    end

    describe "with views" do
      render_views
      it "does not update registration that changed" do
        registration = FactoryBot.create(:registration, competition: competition)

        registration.guests = 4
        registration.save!

        patch :update, params: { id: registration.id, registration: { accepted_at: Time.now, updated_at: 1.day.ago }, from_admin_view: true }
        expect(registration.reload.accepted?).to be false
        expect(response.status).to eq 200
      end
    end

    it "can accept own registration" do
      registration = FactoryBot.create :registration, :pending, competition: competition, user_id: organizer.id

      patch :update, params: { id: registration.id, registration: { status: 'accepted' } }
      expect(registration.reload.accepted?).to eq true
    end

    it "can register for their own competition that is not yet visible" do
      competition.update_column(:showAtAll, false)
      expect(RegistrationsMailer).to receive(:notify_organizers_of_new_registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_new_registration).and_call_original
      expect do
        post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: competition.competition_events.first }], guests: 1, comments: "" } }
      end.to change { enqueued_jobs.size }.by(2)

      expect(organizer.registrations).to eq competition.registrations
    end

    it "can register for their own competition before registration opens" do
      competition.registration_open = 1.weeks.from_now
      competition.registration_close = 2.weeks.from_now
      competition.save!

      expect(RegistrationsMailer).to receive(:notify_organizers_of_new_registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_new_registration).and_call_original
      expect do
        post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: competition.competition_events.first }], guests: 1, comments: "" } }
      end.to change { enqueued_jobs.size }.by(2)

      expect(organizer.registrations).to eq competition.registrations
    end
  end

  context "signed in as a delegate" do
    let!(:delegate) { FactoryBot.create(:delegate) }
    let!(:other_delegate) { FactoryBot.create(:delegate) }

    let!(:competition) { FactoryBot.create(:competition, :registration_open, :visible, delegates: [delegate]) }
    let!(:other_competition) { FactoryBot.create(:competition, :registration_open, :visible, delegates: [other_delegate]) }

    before :each do
      sign_in delegate
    end

    it "can register for their own competition while registration is open" do
      competition.registration_open = 1.weeks.ago
      competition.registration_close = 2.weeks.from_now
      competition.save!

      expect(RegistrationsMailer).to receive(:notify_organizers_of_new_registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_new_registration).and_call_original
      expect do
        post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: competition.competition_events.first }], guests: 1, comments: "" } }
      end.to change { enqueued_jobs.size }.by(2)

      expect(delegate.registrations).to eq competition.registrations
    end

    it "can register for their own competition before registration opens" do
      competition.registration_open = 1.weeks.from_now
      competition.registration_close = 2.weeks.from_now
      competition.save!

      expect(RegistrationsMailer).to receive(:notify_organizers_of_new_registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_new_registration).and_call_original
      expect do
        post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: competition.competition_events.first }], guests: 1, comments: "" } }
      end.to change { enqueued_jobs.size }.by(2)

      expect(delegate.registrations).to eq competition.registrations
    end
  end

  context "signed in as competitor where they can edit their registration" do
    let!(:user) { FactoryBot.create(:user, :wca_id) }
    let!(:competition) { FactoryBot.create(:competition, :registration_open, :editable_registrations, :visible) }
    let(:threes_comp_event) { competition.competition_events.find_by(event_id: "333") }

    before :each do
      sign_in user
    end

    it "cannot change their own registration status" do
      registration = FactoryBot.create :registration, :accepted, competition: competition, user_id: user.id
      expect(registration.accepted?).to eq true
      patch :update, params: {
        id: registration.id,
        registration: { comments: "Changing registration" },
      }
      expect(registration.reload.accepted?).to eq true
    end

    it "can re-create registration after it was deleted" do
      registration = FactoryBot.create :registration, :accepted, :cancelled, competition: competition, user_id: user.id
      registration_competition_event = registration.registration_competition_events.first
      expect(registration.reload.deleted?).to eq true

      patch :update, params: {
        id: registration.id,
        registration: {
          registration_competition_events_attributes: [{ id: registration_competition_event.id, registration_id: registration.id, competition_event_id: threes_comp_event.id, _destroy: 0 }],
          comments: "Registered again",
        },
      }
      expect(registration.reload.comments).to eq "Registered again"
      expect(registration.reload.pending?).to eq true
      expect(registration.reload.accepted?).to eq false
      expect(registration.reload.deleted?).to eq false
      expect(flash[:success]).to eq "Updated registration"
      expect(response).to redirect_to competition_register_path(competition)
    end

    it "can edit registration when pending" do
      registration = FactoryBot.create :registration, :pending, competition: competition, user_id: user.id

      patch :update, params: { id: registration.id, registration: { comments: "new comment" } }
      expect(registration.reload.comments).to eq "new comment"
      expect(flash[:success]).to eq "Updated registration"
      expect(response).to redirect_to competition_register_path(competition)
    end

    it "can edit registration when approved" do
      registration = FactoryBot.create :registration, :accepted, competition: competition, user_id: user.id

      patch :update, params: { id: registration.id, registration: { comments: "new comment" } }
      expect(registration.reload.comments).to eq "new comment"
      expect(flash[:success]).to eq "Updated registration"
    end

    it "cannot edit administrative notes on registration" do
      registration = FactoryBot.create :registration, :pending, competition: competition, user_id: user.id

      patch :update, params: { id: registration.id, registration: { administrative_notes: "admin notes" } }
      expect(registration.reload.administrative_notes).to eq ""
    end
  end

  context "signed in as competitor" do
    let!(:user) { FactoryBot.create(:user, :wca_id) }
    let!(:delegate) { FactoryBot.create(:delegate) }
    let!(:competition) { FactoryBot.create(:competition, :visible, :registration_open, delegates: [delegate]) }
    let(:threes_comp_event) { competition.competition_events.find_by(event_id: "333") }

    before :each do
      sign_in user
    end

    it "can create registration" do
      expect(RegistrationsMailer).to receive(:notify_organizers_of_new_registration).and_call_original
      expect(RegistrationsMailer).to receive(:notify_registrant_of_new_registration).and_call_original
      expect do
        post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: threes_comp_event.id }], guests: 1, comments: "" } }
      end.to change { enqueued_jobs.size }.by(2)

      registration = Registration.find_by_user_id(user.id)
      expect(registration.competition_id).to eq competition.id
    end

    it "can re-create registration after it was deleted" do
      registration = FactoryBot.create :registration, :cancelled, competition: competition, user_id: user.id
      registration_competition_event = registration.registration_competition_events.first
      expect(registration.reload.pending?).to eq false
      expect(registration.reload.accepted?).to eq false
      expect(registration.reload.deleted?).to eq true

      patch :update, params: {
        id: registration.id,
        registration: {
          registration_competition_events_attributes: [{ id: registration_competition_event.id, registration_id: registration.id, competition_event_id: threes_comp_event.id, _destroy: 0 }],
          comments: "Registered again",
        },
      }
      expect(registration.reload.comments).to eq "Registered again"
      expect(registration.reload.pending?).to eq true
      expect(registration.reload.accepted?).to eq false
      expect(registration.reload.deleted?).to eq false
      expect(flash[:success]).to eq "Updated registration"
      expect(response).to redirect_to competition_register_path(competition)
    end

    it "can delete registration when on waitlist" do
      registration = FactoryBot.create :registration, :pending, competition: competition, user_id: user.id

      expect(RegistrationsMailer).to receive(:notify_organizers_of_deleted_registration).and_call_original

      expect do
        delete :destroy, params: { id: registration.id, user_is_deleting_theirself: true }
      end.to change { enqueued_jobs.size }.by(1)

      expect(response).to redirect_to competition_path(competition) + '/register'
      expect(Registration.find_by_id(registration.id).deleted?).to eq true
      expect(flash[:success]).to eq "Successfully deleted your registration for #{competition.name}"
    end

    it "cannot delete registration when approved" do
      registration = FactoryBot.create :registration, :accepted, competition: competition, user_id: user.id

      expect do
        delete :destroy, params: { id: registration.id, user_is_deleting_theirself: true }
      end.to change { enqueued_jobs.size }.by(0)

      expect(response).to redirect_to competition_path(competition) + '/register'
      expect(Registration.find_by_id(registration.id)).not_to eq nil
      expect(flash[:danger]).to eq "You cannot delete your registration."
    end

    it "cannnot delete other people's registrations" do
      FactoryBot.create :registration, competition: competition, user_id: user.id
      other_registration = FactoryBot.create :registration, competition: competition
      delete :destroy, params: { id: other_registration.id, user_is_deleting_theirself: true }
      expect(response).to redirect_to competition_path(competition) + '/register'
      expect(Registration.find_by_id(other_registration.id)).to eq other_registration
    end

    it "cannot create accepted registration" do
      post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: threes_comp_event.id }], guests: 0, comments: "", accepted_at: Time.now } }
      registration = Registration.find_by_user_id(user.id)
      expect(registration.pending?).to be true
    end

    it "cannot create registration when competition is not visible" do
      competition.update_column(:showAtAll, false)

      expect {
        post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: threes_comp_event.id }], guests: 1, comments: "", status: :accepted } }
      }.to raise_error(ActionController::RoutingError)
    end

    it "cannot create registration before registration is open" do
      competition.registration_open = 1.weeks.from_now
      competition.registration_close = 2.weeks.from_now
      competition.save!

      post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: threes_comp_event.id }], guests: 1, comments: "", accepted_at: Time.now } }
      expect(response).to redirect_to competition_path(competition)
      expect(flash[:danger]).to eq "You cannot register for this competition, registration is closed"
    end

    it "cannot create registration after registration is closed" do
      competition.registration_open = 2.weeks.ago
      competition.registration_close = 1.week.ago
      competition.save!

      post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: threes_comp_event.id }], guests: 1, comments: "", accepted_at: Time.now } }
      expect(response).to redirect_to competition_path(competition)
      expect(flash[:danger]).to eq "You cannot register for this competition, registration is closed"
    end

    it "can edit registration when pending" do
      registration = FactoryBot.create :registration, :pending, competition: competition, user_id: user.id

      patch :update, params: { id: registration.id, registration: { comments: "new comment" } }
      expect(registration.reload.comments).to eq "new comment"
      expect(flash[:success]).to eq "Updated registration"
      expect(response).to redirect_to competition_register_path(competition)
    end

    it "cannot edit registration when approved" do
      registration = FactoryBot.create :registration, :accepted, competition: competition, user_id: user.id

      patch :update, params: { id: registration.id, registration: { comments: "new comment" } }
      expect(registration.reload.comments).to eq ""
      expect(flash.now[:danger]).to eq "Could not update registration"
    end

    it "cannot access edit page" do
      registration = FactoryBot.create :registration, :accepted, competition: competition, user_id: user.id
      get :edit, params: { id: registration.id }
      expect(response).to redirect_to root_path
    end

    it "cannot edit administrative notes on registration" do
      registration = FactoryBot.create :registration, :pending, competition: competition, user_id: user.id

      patch :update, params: { id: registration.id, registration: { administrative_notes: "admin notes" } }
      expect(registration.reload.administrative_notes).to eq ""
    end

    it "cannot edit someone else's registration" do
      FactoryBot.create :registration, :accepted, competition: competition, user_id: user.id
      other_user = FactoryBot.create(:user, :wca_id)
      other_registration = FactoryBot.create :registration, :pending, competition: competition, user_id: other_user.id

      patch :update, params: { id: other_registration.id, registration: { comments: "new comment" } }
      expect(other_registration.reload.comments).to eq ""
    end

    it "cannot accept own registration" do
      registration = FactoryBot.create :registration, :pending, competition: competition, user_id: user.id

      patch :update, params: { id: registration.id, registration: { accepted_at: Time.now } }
      expect(registration.reload.accepted?).to eq false
    end

    it "cannot register for cancelled competitions" do
      competition.update!(cancelled_at: Time.now, cancelled_by: FactoryBot.create(:user, :wcat_member).id)
      post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: threes_comp_event.id }], guests: 1, comments: "", status: :accepted } }
      expect(response).to redirect_to(competition_path(competition))
      expect(flash[:danger]).to match "You cannot register for this competition"
    end

    it "creates reg when comment is required and present" do
      competition.force_comment_in_registration = true
      competition.save!
      expect do
        post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: competition.competition_events.first }], guests: 1, comments: "Hvidovre, Denmark" } }
      end.to change { enqueued_jobs.size }.by(2)

      registration = Registration.find_by_user_id(user.id)
      expect(registration.competition_id).to eq competition.id
    end

    it "fails to create reg when comment is required and not present" do
      competition.force_comment_in_registration = true
      competition.save!
      expect do
        post :create, params: { competition_id: competition.id, registration: { registration_competition_events_attributes: [{ competition_event_id: competition.competition_events.first }], guests: 1, comments: " " } }
      end.to change { enqueued_jobs.size }.by(0)

      expect(Registration.find_by_user_id(user.id)).to be nil
    end
  end

  context "register" do
    let(:competition) { FactoryBot.create :competition, :confirmed, :visible, :registration_open }

    it "redirects to competition root if competition is not using WCA registration" do
      competition.use_wca_registration = false
      competition.save!

      get :register, params: { competition_id: competition.id }
      expect(response).to redirect_to competition_path(competition)
      expect(flash[:danger]).to match "not using WCA registration"
    end

    it "works when not logged in" do
      get :register, params: { competition_id: competition.id }
      expect(assigns(:registration)).to eq nil
    end

    it "finds registration when logged in and not registered" do
      registration = FactoryBot.create(:registration, competition: competition)
      sign_in registration.user

      get :register, params: { competition_id: competition.id }
      expect(assigns(:registration)).to eq registration
    end

    it "creates registration when logged in and not registered" do
      user = FactoryBot.create :user
      sign_in user

      get :register, params: { competition_id: competition.id }
      registration = assigns(:registration)
      expect(registration.new_record?).to eq true
      expect(registration.user_id).to eq user.id
    end
  end

  context "competition not visible" do
    let!(:organizer) { FactoryBot.create :user }
    let(:competition) { FactoryBot.create(:competition, :registration_open, events: Event.where(id: %w(333 444 333bf)), showAtAll: false, organizers: [organizer]) }

    it "404s when competition is not visible to public" do
      expect {
        get :psych_sheet_event, params: { competition_id: competition.id, event_id: "333" }
      }.to raise_error(ActionController::RoutingError)
    end

    it "organizer can access psych sheet" do
      sign_in organizer

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "333" }
      expect(response.status).to eq 200
    end
  end

  context "psych sheet when results posted" do
    let(:competition) { FactoryBot.create(:competition, :visible, :past, :results_posted, use_wca_registration: true, events: Event.where(id: "333")) }

    it "renders psych_results_posted" do
      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "333" }
      expect(subject).to render_template(:psych_results_posted)
    end
  end

  context "psych sheet when not signed in" do
    let!(:competition) { FactoryBot.create(:competition, :confirmed, :visible, :registration_open, events: Event.where(id: %w(333 444 333bf))) }

    it "redirects psych sheet to 333" do
      get :psych_sheet, params: { competition_id: competition.id }
      expect(response).to redirect_to competition_psych_sheet_event_url(competition.id, "333")
    end

    it "redirects psych sheet to highest ranked event if no 333" do
      competition.events = [Event.find("222"), Event.find("444")]
      competition.main_event_id = "444"
      competition.save!

      get :psych_sheet, params: { competition_id: competition.id }
      expect(response).to redirect_to competition_psych_sheet_event_url(competition.id, "222")
    end

    it "does not show pending registrations" do
      pending_registration = FactoryBot.create(:registration, competition: competition)
      FactoryBot.create :ranks_average, rank: 10, best: 4242, eventId: "333", personId: pending_registration.personId
      FactoryBot.create :ranks_average, rank: 10, best: 2000, eventId: "333", personId: pending_registration.personId

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "333" }
      psych_sheet = assigns(:psych_sheet)
      expect(psych_sheet.sorted_rankings.length).to eq competition.registrations.accepted.length
    end

    it "handles user without average" do
      FactoryBot.create(:registration, :accepted, competition: competition)

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "333" }
      psych_sheet = assigns(:psych_sheet)
      expect(psych_sheet.sorted_rankings.length).to eq competition.registrations.accepted.length
    end

    it "sorts 444 by single, and average, and handles ties" do
      user_a = FactoryBot.create(:user, :wca_id, name: 'A')
      user_b = FactoryBot.create(:user, :wca_id, name: 'B')

      registration1 = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("444")])
      FactoryBot.create :ranks_average, rank: 1, best: 2000, eventId: "444", personId: registration1.personId
      FactoryBot.create :ranks_single, rank: 1, best: 1500, eventId: "444", personId: registration1.personId

      registration2 = FactoryBot.create(:registration, :accepted, user: user_a, competition: competition, events: [Event.find("444")])
      FactoryBot.create :ranks_average, rank: 10, best: 4242, eventId: "444", personId: registration2.personId
      FactoryBot.create :ranks_single, rank: 10, best: 1900, eventId: "444", personId: registration2.personId

      registration3 = FactoryBot.create(:registration, :accepted, user: user_b, competition: competition, events: [Event.find("444")])
      FactoryBot.create :ranks_average, rank: 10, best: 4242, eventId: "444", personId: registration3.personId
      FactoryBot.create :ranks_single, rank: 10, best: 1900, eventId: "444", personId: registration3.personId

      registration4 = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("444")])
      FactoryBot.create :ranks_average, rank: 20, best: 4545, eventId: "444", personId: registration4.personId
      FactoryBot.create :ranks_single, rank: 30, best: 2500, eventId: "444", personId: registration4.personId

      registration5 = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("444")])
      FactoryBot.create :ranks_average, rank: 20, best: 4545, eventId: "444", personId: registration5.personId
      FactoryBot.create :ranks_single, rank: 31, best: 2600, eventId: "444", personId: registration5.personId

      registration6 = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("444")])

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "444" }
      psych_sheet = assigns(:psych_sheet)
      expect(psych_sheet.sorted_rankings.map(&:wca_id)).to eq [registration1.personId, registration2.personId, registration3.personId, registration4.personId, registration5.personId, registration6.personId]
      expect(psych_sheet.sorted_rankings.map(&:pos)).to eq [1, 2, 2, 4, 5, nil]
      expect(psych_sheet.sorted_rankings.map(&:tied_previous)).to eq [false, false, true, false, false, nil]

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "444", sort_by: :single }
      psych_sheet = assigns(:psych_sheet)
      expect(psych_sheet.sorted_rankings.map(&:wca_id)).to eq [registration1.personId, registration2.personId, registration3.personId, registration4.personId, registration5.personId, registration6.personId]
      expect(psych_sheet.sorted_rankings.map(&:pos)).to eq [1, 2, 2, 4, 5, nil]
      expect(psych_sheet.sorted_rankings.map(&:tied_previous)).to eq [false, false, true, false, false, nil]
    end

    it "handles missing average" do
      # Missing an average
      registration1 = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("444")])
      FactoryBot.create :ranks_single, rank: 2, best: 200, eventId: "444", personId: registration1.personId

      registration2 = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("444")])
      FactoryBot.create :ranks_average, rank: 10, best: 4242, eventId: "444", personId: registration2.personId
      FactoryBot.create :ranks_single, rank: 10, best: 2000, eventId: "444", personId: registration2.personId

      # Never competed
      registration3 = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("444")])

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "444" }
      psych_sheet = assigns(:psych_sheet)
      expect(psych_sheet.sorted_rankings.map(&:wca_id)).to eq [registration2.personId, registration1.personId, registration3.personId]
      expect(psych_sheet.sorted_rankings.map(&:pos)).to eq [1, nil, nil]
    end

    it "handles 1 registration" do
      registration = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("444")])
      RanksAverage.create!(
        personId: registration.personId,
        eventId: "444",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "444" }
      psych_sheet = assigns(:psych_sheet)
      expect(psych_sheet.sorted_rankings.map(&:wca_id)).to eq [registration.personId]
      expect(psych_sheet.sorted_rankings.map(&:pos)).to eq [1]
    end

    it "sorts 333bf by single" do
      registration1 = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("333bf")])
      RanksAverage.create!(
        personId: registration1.personId,
        eventId: "333bf",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )
      RanksSingle.create!(
        personId: registration1.personId,
        eventId: "333bf",
        best: "2000",
        worldRank: 1,
        continentRank: 1,
        countryRank: 1,
      )

      registration2 = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("333bf")])
      RanksAverage.create!(
        personId: registration2.personId,
        eventId: "333bf",
        best: "4242",
        worldRank: 1,
        continentRank: 1,
        countryRank: 1,
      )
      RanksSingle.create!(
        personId: registration2.personId,
        eventId: "333bf",
        best: "2000",
        worldRank: 2,
        continentRank: 2,
        countryRank: 2,
      )

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "333bf" }
      psych_sheet = assigns(:psych_sheet)
      expect(psych_sheet.sorted_rankings.map(&:wca_id)).to eq [registration1.personId, registration2.personId]
      expect(psych_sheet.sorted_rankings.map(&:pos)).to eq [1, 2]

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "333bf", sort_by: :average }
      psych_sheet = assigns(:psych_sheet)
      expect(psych_sheet.sorted_rankings.map(&:wca_id)).to eq [registration2.personId, registration1.personId]
      expect(psych_sheet.sorted_rankings.map(&:pos)).to eq [1, 2]
    end

    it "shows first timers on bottom" do
      registration1 = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("333bf")])
      RanksAverage.create!(
        personId: registration1.personId,
        eventId: "333bf",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )
      RanksSingle.create!(
        personId: registration1.personId,
        eventId: "333bf",
        best: "2000",
        worldRank: 1,
        continentRank: 1,
        countryRank: 1,
      )

      # Someone who has never competed in a WCA competition
      user2 = FactoryBot.create(:user, name: "Zzyzx")
      registration2 = FactoryBot.create(:registration, :accepted, user: user2, competition: competition, events: [Event.find("333bf")])

      # Someone who has never competed in 333bf
      user3 = FactoryBot.create(:user, :wca_id, name: "Aaron")
      registration3 = FactoryBot.create(:registration, :accepted, user: user3, competition: competition, events: [Event.find("333bf")])

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "333bf" }
      psych_sheet = assigns(:psych_sheet)
      expect(psych_sheet.sorted_rankings.map(&:wca_id)).to eq [registration1.personId, registration3.personId, registration2.personId]
      expect(psych_sheet.sorted_rankings.map(&:pos)).to eq [1, nil, nil]
    end

    it "handles 1 registration again" do
      registration = FactoryBot.create(:registration, :accepted, competition: competition, events: [Event.find("444")])
      RanksAverage.create!(
        personId: registration.personId,
        eventId: "444",
        best: "4242",
        worldRank: 10,
        continentRank: 10,
        countryRank: 10,
      )

      get :psych_sheet_event, params: { competition_id: competition.id, event_id: "444" }
      psych_sheet = assigns(:psych_sheet)
      expect(psych_sheet.sorted_rankings.map(&:wca_id)).to eq [registration.personId]
      expect(psych_sheet.sorted_rankings.map(&:pos)).to eq [1]
    end
  end

  describe 'POST #refund_payment' do
    context 'when signed in as a competitor' do
      let(:competition) { FactoryBot.create(:competition, :stripe_connected, :visible, :registration_open, events: Event.where(id: %w(222 333))) }
      let!(:user) { FactoryBot.create(:user, :wca_id) }
      let!(:registration) { FactoryBot.create(:registration, competition: competition, user: user) }

      it 'does not allow access and redirects to root_url' do
        sign_in user

        post :refund_payment, params: {
          competition_id: competition.id,
          payment_integration: :stripe,
          payment_id: registration.id,
        }

        expect(response).to redirect_to root_url
      end
    end

    context 'when signed in as organizer' do
      let(:organizer) { FactoryBot.create(:user) }
      let(:competition) {
        FactoryBot.create(:competition, :stripe_connected, :visible,
                          organizers: [organizer],
                          events: Event.where(id: %w(222 333)),
                          use_wca_registration: true,
                          starts: (ClearConnectedPaymentIntegrations::DELAY_IN_DAYS + 1).days.ago,
                          registration_close: (ClearConnectedPaymentIntegrations::DELAY_IN_DAYS + 3).days.ago)
      }
      let!(:registration) { FactoryBot.create(:registration, competition: competition, user: organizer) }

      context "processes a payment" do
        before :each do
          sign_in organizer
          post :load_payment_intent, params: {
            id: registration.id,
            payment_integration: :stripe,
            amount: registration.outstanding_entry_fees.cents,
          }
          payment_intent = registration.reload.payment_intents.first
          Stripe::PaymentIntent.confirm(
            payment_intent.payment_record.stripe_id,
            { payment_method: 'pm_card_visa' },
            stripe_account: competition.payment_account_for(:stripe).account_id,
          )
          get :payment_completion, params: {
            competition_id: competition.id,
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }
          @payment = registration.reload.registration_payments.first
        end

        it 'issues a full refund' do
          post :refund_payment, params: { competition_id: competition.id, payment_integration: :stripe, payment_id: @payment.receipt.id, payment: { refund_amount: competition.base_entry_fee.cents } }
          expect(response).to redirect_to edit_registration_path(registration)
          refund = registration.reload.registration_payments.last.receipt.retrieve_stripe
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq competition.base_entry_fee
          expect(refund.amount).to eq competition.base_entry_fee.cents
          expect(flash[:success]).to eq "Payment was refunded"
          expect(@payment.reload.amount_available_for_refund).to eq 0
          # Check that the website actually records who made the refund
          expect(registration.registration_payments.last.user).to eq organizer
        end

        it 'issues a 50% refund' do
          refund_amount = competition.base_entry_fee.cents / 2
          post :refund_payment, params: { competition_id: competition.id, payment_integration: :stripe, payment_id: @payment.receipt.id, payment: { refund_amount: refund_amount } }
          expect(response).to redirect_to edit_registration_path(registration)
          refund = registration.reload.registration_payments.last.receipt.retrieve_stripe
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq competition.base_entry_fee / 2
          expect(refund.amount).to eq competition.base_entry_fee.cents / 2
          expect(flash[:success]).to eq "Payment was refunded"
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents / 2
        end

        it 'disallows negative refund' do
          refund_amount = -1
          post :refund_payment, params: { competition_id: competition.id, payment_integration: :stripe, payment_id: @payment.receipt.id, payment: { refund_amount: refund_amount } }
          expect(response).to redirect_to edit_registration_path(registration)
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq 0
          expect(flash[:danger]).to eq "The refund amount must be greater than zero."
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents
        end

        it 'disallows a refund more than the payment' do
          refund_amount = competition.base_entry_fee.cents * 2
          post :refund_payment, params: { competition_id: competition.id, payment_integration: :stripe, payment_id: @payment.receipt.id, payment: { refund_amount: refund_amount } }
          expect(response).to redirect_to edit_registration_path(registration)
          expect(competition.base_entry_fee).to be > 0
          expect(registration.outstanding_entry_fees).to eq 0
          expect(flash[:danger]).to eq "You are not allowed to refund more than the competitor has paid."
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents
        end

        it "disallows a refund after clearing the Stripe account id" do
          ClearConnectedPaymentIntegrations.perform_now
          post :refund_payment, params: { competition_id: competition.id, payment_integration: :stripe, payment_id: @payment.receipt.id, payment: { refund_amount: competition.base_entry_fee.cents } }
          expect(response).to redirect_to competition_registrations_path(competition)
          expect(flash[:danger]).to eq "You cannot issue a refund for this competition anymore. Please use your payment provider's dashboard to do so."
          expect(@payment.reload.amount_available_for_refund).to eq competition.base_entry_fee.cents
        end
      end
    end
  end
end
