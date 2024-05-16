# frozen_string_literal: true

require "rails_helper"

RSpec.describe "competitions" do
  describe "PATCH #update_competition" do
    let!(:existing_competition) { FactoryBot.create(:competition, :with_delegate, :future, :visible, :with_valid_schedule) }

    context "when signed in as admin" do
      sign_in { FactoryBot.create :admin }

      it 'can confirm competition' do
        put competition_confirm_path(existing_competition)
        expect(response).to be_successful

        expect(existing_competition.reload.confirmed?).to eq true
      end

      context "when handling unconfirmed competitions" do
        it 'can set championship types' do
          expect(existing_competition.confirmed?).to be false

          update_params = existing_competition.to_form_data.merge({ championships: ["world", "_Europe"] })
          patch competition_path(existing_competition), params: update_params, as: :json

          expect(response).to be_successful
          expect(existing_competition.reload.championships.count).to eq 2
        end

        context "when handling Series competitions" do
          let!(:series) { FactoryBot.create(:competition_series) }
          let!(:partner_competition) {
            FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                              competition_series: series, series_base: existing_competition)
          }

          it "can add competition to an existing Series" do
            expect(existing_competition.confirmed?).to be false

            series_update_params = series.to_form_data.merge({ competitionIds: [existing_competition.id, partner_competition.id] })
            update_params = existing_competition.to_form_data.merge({ series: series_update_params })
            patch competition_path(existing_competition), params: update_params, as: :json

            expect(response).to be_successful

            existing_competition.reload
            series.reload

            expect(existing_competition.part_of_competition_series?).to eq true
            expect(existing_competition.series_sibling_competitions.count).to eq 1
            expect(series.competitions.count).to eq 2
          end

          it 'can add competition to a new Series' do
            expect(existing_competition.confirmed?).to be false
            partner_competition.update!(competition_series_id: nil)

            update_params = existing_competition.to_form_data.merge({ series: {
                                                             wcifId: "SomeNewSeries2015",
                                                             name: "Some New Series 2015",
                                                             shortName: "Some New Series 2015",
                                                             competitionIds: [partner_competition.id, existing_competition.id],
                                                           } })

            patch competition_path(existing_competition), params: update_params, as: :json
            expect(response).to be_successful

            existing_competition.reload

            expect(existing_competition.part_of_competition_series?).to eq true
            expect(existing_competition.series_sibling_competitions.count).to eq 1
            expect(existing_competition.competition_series.id).not_to eq series.id
          end

          context 'can remove competition from an existing Series' do
            before { existing_competition.update!(competition_series: series) }

            it 'and Series has other competitions so it persists' do
              expect(existing_competition.confirmed?).to be false

              other_partner_competition = FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                                                            competition_series: series, series_base: existing_competition)

              update_params = existing_competition.to_form_data.merge({ series: nil })
              patch competition_path(existing_competition), params: update_params, as: :json

              expect(response).to be_successful

              existing_competition.reload

              expect(existing_competition.part_of_competition_series?).to eq false
              expect(existing_competition.series_sibling_competitions.count).to eq 0

              persisted_series_id = series.id
              series.reload

              expect(series.id).to eq persisted_series_id
              expect(series.competitions.count).to eq 2
              expect(series.competitions).to include(partner_competition, other_partner_competition)
            end

            it "and Series is so small that it gets deleted" do
              expect(existing_competition.confirmed?).to be false

              update_params = existing_competition.to_form_data.merge({ series: nil })
              patch competition_path(existing_competition), params: update_params, as: :json

              expect(response).to be_successful

              existing_competition.reload

              expect(existing_competition.part_of_competition_series?).to eq false
              expect(existing_competition.series_sibling_competitions.count).to eq 0

              expect { series.reload }.to raise_error(ActiveRecord::RecordNotFound)
            end
          end
        end
      end

      context "when handling confirmed competitions" do
        before { existing_competition.update!(confirmed: true) }

        it 'can set championship types' do
          expect(existing_competition.confirmed?).to be true

          update_params = existing_competition.to_form_data.merge({ championships: ["world", "_Europe"] })
          patch competition_path(existing_competition), params: update_params, as: :json

          expect(response).to be_successful

          expect(existing_competition.reload.championships.count).to eq 2
        end

        context "when handling Series competitions" do
          let!(:series) { FactoryBot.create(:competition_series) }
          let!(:partner_competition) {
            FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                              competition_series: series, series_base: existing_competition)
          }

          it "can add competition to an existing Series" do
            expect(existing_competition.confirmed?).to be true

            series_update_params = series.to_form_data.merge({ competitionIds: [existing_competition.id, partner_competition.id] })
            update_params = existing_competition.to_form_data.merge({ series: series_update_params })
            patch competition_path(existing_competition), params: update_params, as: :json

            expect(response).to be_successful

            expect(existing_competition.reload.part_of_competition_series?).to eq true
            expect(existing_competition.reload.series_sibling_competitions.count).to eq 1
            expect(series.reload.competitions.count).to eq 2
          end

          it 'can add competition to a new Series' do
            expect(existing_competition.confirmed?).to be true
            partner_competition.update!(competition_series_id: nil)

            update_params = existing_competition.to_form_data.merge({ series: {
                                                             wcifId: "SomeNewSeries2015",
                                                             name: "Some New Series 2015",
                                                             shortName: "Some New Series 2015",
                                                             competitionIds: [partner_competition.id, existing_competition.id],
                                                           } })

            patch competition_path(existing_competition), params: update_params, as: :json
            expect(response).to be_successful

            existing_competition.reload

            expect(existing_competition.part_of_competition_series?).to eq true
            expect(existing_competition.series_sibling_competitions.count).to eq 1
            expect(existing_competition.competition_series.id).not_to eq series.id
          end

          context 'can remove competition from an existing Series' do
            before { existing_competition.update!(competition_series: series) }

            it "and Series has other competitions so it persists" do
              expect(existing_competition.confirmed?).to be true

              other_partner_competition = FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                                                            competition_series: series, series_base: existing_competition)

              update_params = existing_competition.to_form_data.merge({ series: nil })
              patch competition_path(existing_competition), params: update_params, as: :json

              expect(response).to be_successful

              existing_competition.reload

              expect(existing_competition.part_of_competition_series?).to eq false
              expect(existing_competition.series_sibling_competitions.count).to eq 0

              persisted_series_id = series.id
              series.reload

              expect(series.id).to eq(persisted_series_id)
              expect(series.competitions.count).to eq 2
              expect(series.competitions).to include(partner_competition, other_partner_competition)
            end

            it "and Series is so small that it gets deleted" do
              expect(existing_competition.confirmed?).to be true

              update_params = existing_competition.to_form_data.merge({ series: nil })
              patch competition_path(existing_competition), params: update_params, as: :json

              expect(response).to be_successful

              existing_competition.reload

              expect(existing_competition.part_of_competition_series?).to eq false
              expect(existing_competition.series_sibling_competitions.count).to eq 0

              expect { series.reload }.to raise_error(ActiveRecord::RecordNotFound)
            end
          end
        end
      end
    end

    context 'signed in as a delegate' do
      before :each do
        sign_in existing_competition.delegates.first
        existing_competition.update!(start_date: 5.weeks.from_now, end_date: 5.weeks.from_now)
      end

      context 'when handling unconfirmed competitions' do
        it 'can set championship types' do
          expect(existing_competition.confirmed?).to be false

          update_params = existing_competition.to_form_data.merge({ championships: ["world", "_Europe"] })
          patch competition_path(existing_competition), params: update_params, as: :json

          expect(response).to be_successful
          expect(existing_competition.reload.championships.count).to eq 2
        end

        context "when handling Series competitions" do
          let!(:series) { FactoryBot.create(:competition_series) }
          let!(:partner_competition) {
            FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                              competition_series: series, series_base: existing_competition)
          }

          it "can add competition to an existing Series" do
            expect(existing_competition.confirmed?).to be false

            series_update_params = series.to_form_data.merge({ competitionIds: [existing_competition.id, partner_competition.id] })
            update_params = existing_competition.to_form_data.merge({ series: series_update_params })
            patch competition_path(existing_competition), params: update_params, as: :json

            expect(response).to be_successful

            existing_competition.reload
            series.reload

            expect(existing_competition.part_of_competition_series?).to eq true
            expect(existing_competition.series_sibling_competitions.count).to eq 1
            expect(series.competitions.count).to eq 2
          end

          it 'can add competition to a new Series' do
            expect(existing_competition.confirmed?).to be false
            partner_competition.update!(competition_series_id: nil)

            update_params = existing_competition.to_form_data.merge({ series: {
                                                             wcifId: "SomeNewSeries2015",
                                                             name: "Some New Series 2015",
                                                             shortName: "Some New Series 2015",
                                                             competitionIds: [partner_competition.id, existing_competition.id],
                                                           } })

            patch competition_path(existing_competition), params: update_params, as: :json
            expect(response).to be_successful

            existing_competition.reload

            expect(existing_competition.part_of_competition_series?).to eq true
            expect(existing_competition.series_sibling_competitions.count).to eq 1
            expect(existing_competition.competition_series.id).not_to eq series.id
          end

          context 'can remove competition from an existing Series' do
            before { existing_competition.update!(competition_series: series) }

            it 'and Series has other competitions so it persists' do
              expect(existing_competition.confirmed?).to be false

              other_partner_competition = FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                                                            competition_series: series, series_base: existing_competition)

              update_params = existing_competition.to_form_data.merge({ series: nil })
              patch competition_path(existing_competition), params: update_params, as: :json

              expect(response).to be_successful

              existing_competition.reload

              expect(existing_competition.part_of_competition_series?).to eq false
              expect(existing_competition.series_sibling_competitions.count).to eq 0

              persisted_series_id = series.id
              series.reload

              expect(series.id).to eq persisted_series_id
              expect(series.competitions.count).to eq 2
              expect(series.competitions).to include(partner_competition, other_partner_competition)
            end

            it "and Series is so small that it gets deleted" do
              expect(existing_competition.confirmed?).to be false

              update_params = existing_competition.to_form_data.merge({ series: nil })
              patch competition_path(existing_competition), params: update_params, as: :json

              expect(response).to be_successful

              existing_competition.reload

              expect(existing_competition.part_of_competition_series?).to eq false
              expect(existing_competition.series_sibling_competitions.count).to eq 0

              expect { series.reload }.to raise_error(ActiveRecord::RecordNotFound)
            end
          end
        end
      end

      context 'when handling confirmed competitions' do
        before { existing_competition.update!(confirmed: true) }

        it 'cannot set championship types' do
          expect(existing_competition.confirmed?).to be true

          update_params = existing_competition.to_form_data.merge({ championships: ["world", "_Europe"] })
          patch competition_path(existing_competition), params: update_params, as: :json

          expect(response).to have_http_status(:unprocessable_entity)

          expect(existing_competition.reload.championships.count).to eq 0
        end

        context "when handling Series competitions" do
          let!(:series) { FactoryBot.create(:competition_series) }
          let!(:partner_competition) {
            FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                              competition_series: series, series_base: existing_competition)
          }

          it 'cannot add competition to an existing Series' do
            expect(existing_competition.confirmed?).to be true

            series_update_params = series.to_form_data.merge({ competitionIds: [existing_competition.id, partner_competition.id] })
            update_params = existing_competition.to_form_data.merge({ series: series_update_params })
            patch competition_path(existing_competition), params: update_params, as: :json

            expect(response).to have_http_status(:unprocessable_entity)

            existing_competition.reload

            expect(existing_competition.part_of_competition_series?).to eq false
            expect(existing_competition.series_sibling_competitions.count).to eq 0
          end

          it 'cannot add competition to a new Series' do
            expect(existing_competition.confirmed?).to be true
            partner_competition.update!(competition_series_id: nil)

            update_params = existing_competition.to_form_data.merge({ series: {
                                                             wcifId: "SomeNewSeries2015",
                                                             name: "Some New Series 2015",
                                                             shortName: "Some New Series 2015",
                                                             competitionIds: [partner_competition.id, existing_competition.id],
                                                           } })

            patch competition_path(existing_competition), params: update_params, as: :json
            expect(response).to have_http_status(:unprocessable_entity)

            existing_competition.reload

            expect(existing_competition.part_of_competition_series?).to eq false
            expect(existing_competition.series_sibling_competitions.count).to eq 0
          end

          it 'cannot remove competition from an existing Series' do
            existing_competition.update!(competition_series: series)
            expect(existing_competition.confirmed?).to be true

            update_params = existing_competition.to_form_data.merge({ series: nil })
            patch competition_path(existing_competition), params: update_params, as: :json

            expect(response).to have_http_status(:unprocessable_entity)

            existing_competition.reload
            series.reload

            expect(existing_competition.part_of_competition_series?).to eq true
            expect(existing_competition.series_sibling_competitions.count).to eq 1
            expect(series.competitions.count).to eq 2
            expect(series.competitions).to include(existing_competition, partner_competition)
          end
        end
      end
    end
  end
end
