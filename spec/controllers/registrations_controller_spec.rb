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
