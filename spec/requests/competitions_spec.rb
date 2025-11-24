# frozen_string_literal: true

require "rails_helper"

RSpec.describe "competitions" do
  let!(:competition) { create(:competition, :with_delegate, :future, :visible, :auto_accept, :with_valid_schedule) }

  describe "PATCH #update_competition" do
    context "when signed in as admin" do
      before { sign_in create :admin }

      it 'can confirm competition' do
        put competition_confirm_path(competition)
        expect(response).to be_successful

        expect(competition.reload.confirmed?).to be true
      end

      context "when handling unconfirmed competitions" do
        it 'can set championship types' do
          expect(competition.confirmed?).to be false

          update_params = build_competition_update(competition, championships: %w[world _Europe])
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful
          expect(competition.reload.championships.count).to eq 2
        end

        context "when handling Series competitions" do
          let!(:series) { create(:competition_series) }
          let!(:partner_competition) do
            create(:competition, :with_delegate, :visible, :with_valid_schedule,
                   competition_series: series, series_base: competition)
          end

          it "can add competition to an existing Series" do
            expect(competition.confirmed?).to be false

            series_update_params = series.to_form_data.merge({ competitionIds: [competition.id, partner_competition.id] })
            update_params = build_competition_update(competition, series: series_update_params)
            patch competition_path(competition), params: update_params, as: :json

            expect(response).to be_successful

            competition.reload
            series.reload

            expect(competition.part_of_competition_series?).to be true
            expect(competition.series_sibling_competitions.count).to eq 1
            expect(series.competitions.count).to eq 2
          end

          it 'can add competition to a new Series' do
            expect(competition.confirmed?).to be false
            partner_competition.update!(competition_series_id: nil)

            update_params = build_competition_update(competition, series: {
                                                       wcifId: "SomeNewSeries2015",
                                                       name: "Some New Series 2015",
                                                       shortName: "Some New Series 2015",
                                                       competitionIds: [partner_competition.id, competition.id],
                                                     })

            patch competition_path(competition), params: update_params, as: :json
            expect(response).to be_successful

            competition.reload

            expect(competition.part_of_competition_series?).to be true
            expect(competition.series_sibling_competitions.count).to eq 1
            expect(competition.competition_series.id).not_to eq series.id
          end

          context 'can remove competition from an existing Series' do
            before { competition.update!(competition_series: series) }

            it 'and Series has other competitions so it persists' do
              expect(competition.confirmed?).to be false

              other_partner_competition = create(:competition, :with_delegate, :visible, :with_valid_schedule,
                                                 competition_series: series, series_base: competition)

              update_params = build_competition_update(competition, series: nil)
              patch competition_path(competition), params: update_params, as: :json

              expect(response).to be_successful

              competition.reload

              expect(competition.part_of_competition_series?).to be false
              expect(competition.series_sibling_competitions.count).to eq 0

              persisted_series_id = series.id
              series.reload

              expect(series.id).to eq persisted_series_id
              expect(series.competitions.count).to eq 2
              expect(series.competitions).to include(partner_competition, other_partner_competition)
            end

            it "and Series is so small that it gets deleted" do
              expect(competition.confirmed?).to be false

              update_params = build_competition_update(competition, series: nil)
              patch competition_path(competition), params: update_params, as: :json

              expect(response).to be_successful

              competition.reload

              expect(competition.part_of_competition_series?).to be false
              expect(competition.series_sibling_competitions.count).to eq 0

              expect { series.reload }.to raise_error(ActiveRecord::RecordNotFound)
            end
          end
        end
      end

      context "when handling confirmed competitions" do
        before { competition.update!(confirmed: true) }

        it 'can set championship types' do
          expect(competition.confirmed?).to be true

          update_params = build_competition_update(competition, championships: %w[world _Europe])
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful

          expect(competition.reload.championships.count).to eq 2
        end

        context "when handling Series competitions" do
          let!(:series) { create(:competition_series) }
          let!(:partner_competition) do
            create(:competition, :with_delegate, :visible, :with_valid_schedule,
                   competition_series: series, series_base: competition)
          end

          it "can add competition to an existing Series" do
            expect(competition.confirmed?).to be true

            series_update_params = series.to_form_data.merge({ competitionIds: [competition.id, partner_competition.id] })
            update_params = build_competition_update(competition, series: series_update_params)
            patch competition_path(competition), params: update_params, as: :json

            expect(response).to be_successful

            expect(competition.reload.part_of_competition_series?).to be true
            expect(competition.reload.series_sibling_competitions.count).to eq 1
            expect(series.reload.competitions.count).to eq 2
          end

          it 'can add competition to a new Series' do
            expect(competition.confirmed?).to be true
            partner_competition.update!(competition_series_id: nil)

            update_params = build_competition_update(competition, series: {
                                                       wcifId: "SomeNewSeries2015",
                                                       name: "Some New Series 2015",
                                                       shortName: "Some New Series 2015",
                                                       competitionIds: [partner_competition.id, competition.id],
                                                     })

            patch competition_path(competition), params: update_params, as: :json
            expect(response).to be_successful

            competition.reload

            expect(competition.part_of_competition_series?).to be true
            expect(competition.series_sibling_competitions.count).to eq 1
            expect(competition.competition_series.id).not_to eq series.id
          end

          context 'can remove competition from an existing Series' do
            before { competition.update!(competition_series: series) }

            it "and Series has other competitions so it persists" do
              expect(competition.confirmed?).to be true

              other_partner_competition = create(:competition, :with_delegate, :visible, :with_valid_schedule,
                                                 competition_series: series, series_base: competition)

              update_params = build_competition_update(competition, series: nil)
              patch competition_path(competition), params: update_params, as: :json

              expect(response).to be_successful

              competition.reload

              expect(competition.part_of_competition_series?).to be false
              expect(competition.series_sibling_competitions.count).to eq 0

              persisted_series_id = series.id
              series.reload

              expect(series.id).to eq(persisted_series_id)
              expect(series.competitions.count).to eq 2
              expect(series.competitions).to include(partner_competition, other_partner_competition)
            end

            it "and Series is so small that it gets deleted" do
              expect(competition.confirmed?).to be true

              update_params = build_competition_update(competition, series: nil)
              patch competition_path(competition), params: update_params, as: :json

              expect(response).to be_successful

              competition.reload

              expect(competition.part_of_competition_series?).to be false
              expect(competition.series_sibling_competitions.count).to eq 0

              expect { series.reload }.to raise_error(ActiveRecord::RecordNotFound)
            end
          end
        end
      end
    end

    context 'signed in as a delegate' do
      before :each do
        sign_in competition.delegates.first
        competition.update!(start_date: 5.weeks.from_now, end_date: 5.weeks.from_now)
      end

      context 'when handling unconfirmed competitions' do
        it 'can set championship types' do
          expect(competition.confirmed?).to be false

          update_params = build_competition_update(competition, championships: %w[world _Europe])
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful
          expect(competition.reload.championships.count).to eq 2
        end

        context "when handling Series competitions" do
          let!(:series) { create(:competition_series) }
          let!(:partner_competition) do
            create(:competition, :with_delegate, :visible, :with_valid_schedule,
                   competition_series: series, series_base: competition)
          end

          it "can add competition to an existing Series" do
            expect(competition.confirmed?).to be false

            series_update_params = series.to_form_data.merge({ competitionIds: [competition.id, partner_competition.id] })
            update_params = build_competition_update(competition, series: series_update_params)
            patch competition_path(competition), params: update_params, as: :json

            expect(response).to be_successful

            competition.reload
            series.reload

            expect(competition.part_of_competition_series?).to be true
            expect(competition.series_sibling_competitions.count).to eq 1
            expect(series.competitions.count).to eq 2
          end

          it 'can add competition to a new Series' do
            expect(competition.confirmed?).to be false
            partner_competition.update!(competition_series_id: nil)

            update_params = build_competition_update(competition, series: {
                                                       wcifId: "SomeNewSeries2015",
                                                       name: "Some New Series 2015",
                                                       shortName: "Some New Series 2015",
                                                       competitionIds: [partner_competition.id, competition.id],
                                                     })

            patch competition_path(competition), params: update_params, as: :json
            expect(response).to be_successful

            competition.reload

            expect(competition.part_of_competition_series?).to be true
            expect(competition.series_sibling_competitions.count).to eq 1
            expect(competition.competition_series.id).not_to eq series.id
          end

          context 'can remove competition from an existing Series' do
            before { competition.update!(competition_series: series) }

            it 'and Series has other competitions so it persists' do
              expect(competition.confirmed?).to be false

              other_partner_competition = create(:competition, :with_delegate, :visible, :with_valid_schedule,
                                                 competition_series: series, series_base: competition)

              update_params = build_competition_update(competition, series: nil)
              patch competition_path(competition), params: update_params, as: :json

              expect(response).to be_successful

              competition.reload

              expect(competition.part_of_competition_series?).to be false
              expect(competition.series_sibling_competitions.count).to eq 0

              persisted_series_id = series.id
              series.reload

              expect(series.id).to eq persisted_series_id
              expect(series.competitions.count).to eq 2
              expect(series.competitions).to include(partner_competition, other_partner_competition)
            end

            it "and Series is so small that it gets deleted" do
              expect(competition.confirmed?).to be false

              update_params = build_competition_update(competition, series: nil)
              patch competition_path(competition), params: update_params, as: :json

              expect(response).to be_successful

              competition.reload

              expect(competition.part_of_competition_series?).to be false
              expect(competition.series_sibling_competitions.count).to eq 0

              expect { series.reload }.to raise_error(ActiveRecord::RecordNotFound)
            end
          end
        end
      end

      context 'when handling confirmed competitions' do
        before { competition.update!(confirmed: true) }

        it 'cannot set championship types' do
          expect(competition.confirmed?).to be true

          update_params = build_competition_update(competition, championships: %w[world _Europe])
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to have_http_status(:unprocessable_content)

          expect(competition.reload.championships.count).to eq 0
        end

        it 'cannot set deadlines if already past' do
          # In order to allow any deadlines to be in the past, we must also push the registration to the past.
          competition.update!(registration_open: 21.days.ago, registration_close: 14.days.ago)

          original_deadline_date = competition.registration_close + 1.day
          competition.update!(waiting_list_deadline_date: original_deadline_date)

          expect(competition.confirmed?).to be true
          new_deadline_date = competition.registration_close + 3.days

          update_params = build_competition_update(competition, registration: { waitingListDeadlineDate: new_deadline_date.iso8601 })
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to have_http_status(:unprocessable_content)

          expect(competition.reload.waiting_list_deadline_date).to eq original_deadline_date
        end

        it 'can extend deadlines if not yet past' do
          competition.update!(registration_close: 3.days.from_now, waiting_list_deadline_date: 5.days.from_now)

          expect(competition.confirmed?).to be true
          new_deadline_date = competition.waiting_list_deadline_date + 2.days

          update_params = build_competition_update(competition, registration: { waitingListDeadlineDate: new_deadline_date.iso8601 })
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful

          expect(competition.reload.waiting_list_deadline_date).to eq new_deadline_date
        end

        it 'cannot shorten deadlines even if not yet past' do
          competition.update!(registration_close: 3.days.from_now, waiting_list_deadline_date: 1.week.from_now)

          original_deadline_date = competition.waiting_list_deadline_date

          expect(competition.confirmed?).to be true
          new_deadline_date = competition.registration_close + 1.day

          update_params = build_competition_update(competition, registration: { waitingListDeadlineDate: new_deadline_date.iso8601 })
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to have_http_status(:unprocessable_content)

          expect(competition.reload.waiting_list_deadline_date).to eq original_deadline_date
        end

        it 'can set generic competition information' do
          expect(competition.confirmed?).to be true

          update_params = build_competition_update(competition, information: 'New amazing information')
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful

          expect(competition.reload.information).to eq "New amazing information"
        end

        context "when handling Series competitions" do
          let!(:series) { create(:competition_series) }
          let!(:partner_competition) do
            create(:competition, :with_delegate, :visible, :with_valid_schedule,
                   competition_series: series, series_base: competition)
          end

          it 'cannot add competition to an existing Series' do
            expect(competition.confirmed?).to be true

            update_params = build_competition_update(competition, series: { competitionIds: [competition.id, partner_competition.id] })
            patch competition_path(competition), params: update_params, as: :json

            expect(response).to have_http_status(:unprocessable_content)

            competition.reload

            expect(competition.part_of_competition_series?).to be false
            expect(competition.series_sibling_competitions.count).to eq 0
          end

          it 'cannot add competition to a new Series' do
            expect(competition.confirmed?).to be true
            partner_competition.update!(competition_series_id: nil)

            update_params = build_competition_update(competition, series: {
                                                       wcifId: "SomeNewSeries2015",
                                                       name: "Some New Series 2015",
                                                       shortName: "Some New Series 2015",
                                                       competitionIds: [partner_competition.id, competition.id],
                                                     })

            patch competition_path(competition), params: update_params, as: :json
            expect(response).to have_http_status(:unprocessable_content)

            competition.reload

            expect(competition.part_of_competition_series?).to be false
            expect(competition.series_sibling_competitions.count).to eq 0
          end

          it 'cannot remove competition from an existing Series' do
            competition.update!(competition_series: series)
            expect(competition.confirmed?).to be true

            update_params = build_competition_update(competition, series: nil)
            patch competition_path(competition), params: update_params, as: :json

            expect(response).to have_http_status(:unprocessable_content)

            competition.reload
            series.reload

            expect(competition.part_of_competition_series?).to be true
            expect(competition.series_sibling_competitions.count).to eq 1
            expect(series.competitions.count).to eq 2
            expect(series.competitions).to include(competition, partner_competition)
          end
        end
      end
    end
  end

  describe "GET #connect_payment_integration" do
    before do
      sign_in competition.delegates.first
    end

    it 'rejects an invalid payment integration type' do
      get competition_connect_payment_integration_path(competition, 'invalid')
      expect(response).not_to be_successful
    end

    context 'connecting stripe integration' do
      # This is the furthest I got without detouring into the Stripe account connection workflow
      # It validates the first half of the controller code, including catching an incorrect function name that initially went undetected
      it 'fails due to no authorization code provided' do
        expected_error = { error: "invalid_request", error_description: "No authorization code provided" }.stringify_keys
        expect do
          get competition_connect_payment_integration_path(competition, 'stripe')
        end.to raise_error(OAuth2::Error) do |error|
          expect(error.response.status).to eq(400)
          expect(JSON.parse(error.response.body)).to eq(expected_error)
        end
      end
    end

    context 'connecting a manual integration' do
      let(:unencoded_payment_instructions) { 'example instructions' }
      let(:manual_payment_reference_label) { 'test ref' }

      before do
        get competition_connect_payment_integration_path(competition, 'manual'), params: {
          payment_instructions: "ZXhhbXBsZSBpbnN0cnVjdGlvbnM", payment_reference_label: "test ref"
        }
      end

      it 'returns redirects to confirmation page response' do
        expect(response).to redirect_to(competition_payment_integration_setup_path(competition))
      end

      it 'creates a connected_payment_integration record' do
        expect(ManualPaymentIntegration.count).to eq(1)
      end

      it 'populates the integration with the submitted data' do
        integration = ManualPaymentIntegration.first
        expect(integration.payment_instructions).to eq(unencoded_payment_instructions)
        expect(integration.payment_reference_label).to eq(manual_payment_reference_label)
      end
    end

    context 'updating a manual integration' do
      let(:comp_with_manual_integration) do
        create(:competition, :with_delegate, :future, :visible, :with_valid_schedule, :manual_connected)
      end
      let(:updated_instructions) { 'Updated instructions' }
      let(:updated_label) { 'Updated label' }

      before do
        sign_in comp_with_manual_integration.delegates.first
      end

      it 'returns redirects to confirmation page response' do
        get competition_connect_payment_integration_path(comp_with_manual_integration, 'manual'), params: {
          payment_instructions: "VXBkYXRlZCBpbnN0cnVjdGlvbnM=", payment_reference_label: updated_label
        }

        expect(response).to redirect_to(competition_payment_integration_setup_path(comp_with_manual_integration))
      end

      it 'does not create a new connected_payment_integration record' do
        expect(ManualPaymentIntegration.count).to eq(1) # Confirm we already have a manual payment integration

        get competition_connect_payment_integration_path(comp_with_manual_integration, 'manual'), params: {
          payment_instructions: "VXBkYXRlZCBpbnN0cnVjdGlvbnM=", payment_reference_label: updated_label
        }

        expect(ManualPaymentIntegration.count).to eq(1)
      end

      it 'updates the integration with the submitted data' do
        # Confirm the existing integration data is different to what we're submitting - we expect the values from the factory
        integration = ManualPaymentIntegration.first
        expect(integration.payment_instructions).to eq("Cash in an unmarked envelope left under a bench in the park")
        expect(integration.payment_reference_label).to eq("Bench Location")

        get competition_connect_payment_integration_path(comp_with_manual_integration, 'manual'), params: {
          payment_instructions: "VXBkYXRlZCBpbnN0cnVjdGlvbnM=", payment_reference_label: updated_label
        }

        expect(integration.reload.payment_instructions).to eq(updated_instructions)
        expect(integration.reload.payment_reference_label).to eq(updated_label)
      end
    end
  end
end

def build_competition_update(comp, **override_params)
  comp.to_form_data.deep_symbolize_keys.merge({ id: comp.id }).deep_merge(override_params)
end
