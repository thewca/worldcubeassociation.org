# frozen_string_literal: true

require "rails_helper"

RSpec.describe "competitions" do
  let!(:competition) { FactoryBot.create(:competition, :with_delegate, :future, :visible, :with_valid_schedule) }

  describe "PATCH #update_competition" do
    context "when signed in as admin" do
      sign_in { FactoryBot.create :admin }

      it 'can confirm competition' do
        put competition_confirm_path(competition)
        expect(response).to be_successful

        expect(competition.reload.confirmed?).to eq true
      end

      context "when handling unconfirmed competitions" do
        it 'can set championship types' do
          expect(competition.confirmed?).to be false

          update_params = build_competition_update(competition, championships: ["world", "_Europe"])
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful
          expect(competition.reload.championships.count).to eq 2
        end

        context "when handling Series competitions" do
          let!(:series) { FactoryBot.create(:competition_series) }
          let!(:partner_competition) {
            FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                              competition_series: series, series_base: competition)
          }

          it "can add competition to an existing Series" do
            expect(competition.confirmed?).to be false

            series_update_params = series.to_form_data.merge({ competitionIds: [competition.id, partner_competition.id] })
            update_params = build_competition_update(competition, series: series_update_params)
            patch competition_path(competition), params: update_params, as: :json

            expect(response).to be_successful

            competition.reload
            series.reload

            expect(competition.part_of_competition_series?).to eq true
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

            expect(competition.part_of_competition_series?).to eq true
            expect(competition.series_sibling_competitions.count).to eq 1
            expect(competition.competition_series.id).not_to eq series.id
          end

          context 'can remove competition from an existing Series' do
            before { competition.update!(competition_series: series) }

            it 'and Series has other competitions so it persists' do
              expect(competition.confirmed?).to be false

              other_partner_competition = FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                                                            competition_series: series, series_base: competition)

              update_params = build_competition_update(competition, series: nil)
              patch competition_path(competition), params: update_params, as: :json

              expect(response).to be_successful

              competition.reload

              expect(competition.part_of_competition_series?).to eq false
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

              expect(competition.part_of_competition_series?).to eq false
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

          update_params = build_competition_update(competition, championships: ["world", "_Europe"])
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful

          expect(competition.reload.championships.count).to eq 2
        end

        context "when handling Series competitions" do
          let!(:series) { FactoryBot.create(:competition_series) }
          let!(:partner_competition) {
            FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                              competition_series: series, series_base: competition)
          }

          it "can add competition to an existing Series" do
            expect(competition.confirmed?).to be true

            series_update_params = series.to_form_data.merge({ competitionIds: [competition.id, partner_competition.id] })
            update_params = build_competition_update(competition, series: series_update_params)
            patch competition_path(competition), params: update_params, as: :json

            expect(response).to be_successful

            expect(competition.reload.part_of_competition_series?).to eq true
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

            expect(competition.part_of_competition_series?).to eq true
            expect(competition.series_sibling_competitions.count).to eq 1
            expect(competition.competition_series.id).not_to eq series.id
          end

          context 'can remove competition from an existing Series' do
            before { competition.update!(competition_series: series) }

            it "and Series has other competitions so it persists" do
              expect(competition.confirmed?).to be true

              other_partner_competition = FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                                                            competition_series: series, series_base: competition)

              update_params = build_competition_update(competition, series: nil)
              patch competition_path(competition), params: update_params, as: :json

              expect(response).to be_successful

              competition.reload

              expect(competition.part_of_competition_series?).to eq false
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

              expect(competition.part_of_competition_series?).to eq false
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

          update_params = build_competition_update(competition, championships: ["world", "_Europe"])
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful
          expect(competition.reload.championships.count).to eq 2
        end

        context "when handling Series competitions" do
          let!(:series) { FactoryBot.create(:competition_series) }
          let!(:partner_competition) {
            FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                              competition_series: series, series_base: competition)
          }

          it "can add competition to an existing Series" do
            expect(competition.confirmed?).to be false

            series_update_params = series.to_form_data.merge({ competitionIds: [competition.id, partner_competition.id] })
            update_params = build_competition_update(competition, series: series_update_params)
            patch competition_path(competition), params: update_params, as: :json

            expect(response).to be_successful

            competition.reload
            series.reload

            expect(competition.part_of_competition_series?).to eq true
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

            expect(competition.part_of_competition_series?).to eq true
            expect(competition.series_sibling_competitions.count).to eq 1
            expect(competition.competition_series.id).not_to eq series.id
          end

          context 'can remove competition from an existing Series' do
            before { competition.update!(competition_series: series) }

            it 'and Series has other competitions so it persists' do
              expect(competition.confirmed?).to be false

              other_partner_competition = FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                                                            competition_series: series, series_base: competition)

              update_params = build_competition_update(competition, series: nil)
              patch competition_path(competition), params: update_params, as: :json

              expect(response).to be_successful

              competition.reload

              expect(competition.part_of_competition_series?).to eq false
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

              expect(competition.part_of_competition_series?).to eq false
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

          update_params = build_competition_update(competition, championships: ["world", "_Europe"])
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to have_http_status(:unprocessable_entity)

          expect(competition.reload.championships.count).to eq 0
        end

        it 'cannot set deadlines if already past' do
          competition.update!(waiting_list_deadline_date: competition.registration_close + 1.day)

          expect(competition.confirmed?).to be true
          new_deadline_date = competition.registration_close + 3.days

          update_params = build_competition_update(competition, registration: { waitingListDeadlineDate: new_deadline_date.iso8601 })
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful

          expect(competition.reload.waiting_list_deadline_date).to eq Date.yesterday
        end

        it 'can set deadlines if not yet past' do
          competition.update!(waiting_list_deadline_date: competition.registration_close + 1.day)

          expect(competition.confirmed?).to be true
          new_deadline_date = competition.registration_close + 3.days

          update_params = build_competition_update(competition, registration: { waitingListDeadlineDate: new_deadline_date.iso8601 })
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful

          expect(competition.reload.waiting_list_deadline_date).to eq new_deadline_date
        end

        it 'can set generic competition information' do
          expect(competition.confirmed?).to be true

          update_params = build_competition_update(competition, information: 'New amazing information')
          patch competition_path(competition), params: update_params, as: :json

          expect(response).to be_successful

          expect(competition.reload.information).to eq "New amazing information"
        end

        context "when handling Series competitions" do
          let!(:series) { FactoryBot.create(:competition_series) }
          let!(:partner_competition) {
            FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                              competition_series: series, series_base: competition)
          }

          it 'cannot add competition to an existing Series' do
            expect(competition.confirmed?).to be true

            update_params = build_competition_update(competition, series: { competitionIds: [competition.id, partner_competition.id] })
            patch competition_path(competition), params: update_params, as: :json

            expect(response).to have_http_status(:unprocessable_entity)

            competition.reload

            expect(competition.part_of_competition_series?).to eq false
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
            expect(response).to have_http_status(:unprocessable_entity)

            competition.reload

            expect(competition.part_of_competition_series?).to eq false
            expect(competition.series_sibling_competitions.count).to eq 0
          end

          it 'cannot remove competition from an existing Series' do
            competition.update!(competition_series: series)
            expect(competition.confirmed?).to be true

            update_params = build_competition_update(competition, series: nil)
            patch competition_path(competition), params: update_params, as: :json

            expect(response).to have_http_status(:unprocessable_entity)

            competition.reload
            series.reload

            expect(competition.part_of_competition_series?).to eq true
            expect(competition.series_sibling_competitions.count).to eq 1
            expect(series.competitions.count).to eq 2
            expect(series.competitions).to include(competition, partner_competition)
          end
        end
      end
    end
  end
end

def build_competition_update(comp, **override_params)
  comp.to_form_data.deep_symbolize_keys.merge({ id: comp.id }).deep_merge(override_params)
end
