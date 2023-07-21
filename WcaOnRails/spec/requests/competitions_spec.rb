# frozen_string_literal: true

require "rails_helper"

RSpec.describe "competitions" do
  let!(:competition) { FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule) }

  describe "PATCH #update_competition" do
    context "when signed in as admin" do
      sign_in { FactoryBot.create :admin }

      it 'can confirm competition' do
        patch competition_path(competition), params: {
          'competition[name]' => competition.name,
          'competition[staff_delegate_ids]' => competition.staff_delegate_ids,
          'commit' => 'Confirm',
        }
        follow_redirect!
        expect(response).to be_successful

        expect(competition.reload.confirmed?).to eq true
      end

      context "when handling unconfirmed competitions" do
        it 'can set championship types' do
          expect(competition.confirmed?).to be false

          patch competition_path(competition), params: {
            competition: {
              championships_attributes: {
                "1" => { championship_type: "world" },
                "0" => { championship_type: "_Europe" },
              },
            },
          }
          follow_redirect!
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

            patch competition_path(competition), params: {
              competition: {
                competition_series_attributes: {
                  id: series.id,
                  competition_ids: [partner_competition.id, competition.id].join(","),
                },
              },
            }
            follow_redirect!
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

            patch competition_path(competition), params: {
              competition: {
                competition_series_attributes: {
                  wcif_id: "SomeNewSeries2015",
                  name: "Some New Series 2015",
                  short_name: "Some New Series 2015",
                  competition_ids: [partner_competition.id, competition.id].join(","),
                },
              },
            }
            follow_redirect!
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

              patch competition_path(competition), params: {
                competition: {
                  competition_series_attributes: {
                    id: series.id,
                    _destroy: true,
                  },
                },
              }
              follow_redirect!
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

              patch competition_path(competition), params: {
                competition: {
                  competition_series_attributes: {
                    id: series.id,
                    _destroy: true,
                  },
                },
              }
              follow_redirect!
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

          patch competition_path(competition), params: {
            competition: {
              championships_attributes: {
                "1" => { championship_type: "world" },
                "0" => { championship_type: "_Europe" },
              },
            },
          }
          follow_redirect!
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

            patch competition_path(competition), params: {
              competition: {
                competition_series_attributes: {
                  id: series.id,
                  competition_ids: [partner_competition.id, competition.id].join(","),
                },
              },
            }
            follow_redirect!
            expect(response).to be_successful

            expect(competition.reload.part_of_competition_series?).to eq true
            expect(competition.reload.series_sibling_competitions.count).to eq 1
            expect(series.reload.competitions.count).to eq 2
          end

          it 'can add competition to a new Series' do
            expect(competition.confirmed?).to be true
            partner_competition.update!(competition_series_id: nil)

            patch competition_path(competition), params: {
              competition: {
                competition_series_attributes: {
                  wcif_id: "SomeNewSeries2015",
                  name: "Some New Series 2015",
                  short_name: "Some New Series 2015",
                  competition_ids: [partner_competition.id, competition.id].join(","),
                },
              },
            }
            follow_redirect!
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

              patch competition_path(competition), params: {
                competition: {
                  competition_series_attributes: {
                    id: series.id,
                    _destroy: true,
                  },
                },
              }
              follow_redirect!
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

              patch competition_path(competition), params: {
                competition: {
                  competition_series_attributes: {
                    id: series.id,
                    _destroy: true,
                  },
                },
              }
              follow_redirect!
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

          patch competition_path(competition), params: {
            competition: {
              championships_attributes: {
                "1" => { championship_type: "world" },
                "0" => { championship_type: "_Europe" },
              },
            },
          }
          follow_redirect!
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

            patch competition_path(competition), params: {
              competition: {
                competition_series_attributes: {
                  id: series.id,
                  competition_ids: [partner_competition.id, competition.id].join(","),
                },
              },
            }
            follow_redirect!
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

            patch competition_path(competition), params: {
              competition: {
                competition_series_attributes: {
                  wcif_id: "SomeNewSeries2015",
                  name: "Some New Series 2015",
                  short_name: "Some New Series 2015",
                  competition_ids: [partner_competition.id, competition.id].join(","),
                },
              },
            }
            follow_redirect!
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

              patch competition_path(competition), params: {
                competition: {
                  competition_series_attributes: {
                    id: series.id,
                    _destroy: true,
                  },
                },
              }
              follow_redirect!
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

              patch competition_path(competition), params: {
                competition: {
                  competition_series_attributes: {
                    id: series.id,
                    _destroy: true,
                  },
                },
              }
              follow_redirect!
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

          patch competition_path(competition), params: {
            competition: {
              championships_attributes: {
                "1" => { championship_type: "world" },
                "0" => { championship_type: "_Europe" },
              },
            },
          }
          follow_redirect!
          expect(response).to be_successful

          expect(competition.reload.championships.count).to eq 0
        end

        context "when handling Series competitions" do
          let!(:series) { FactoryBot.create(:competition_series) }
          let!(:partner_competition) {
            FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule,
                              competition_series: series, series_base: competition)
          }

          it 'cannot add competition to an existing Series' do
            expect(competition.confirmed?).to be true

            patch competition_path(competition), params: {
              competition: {
                competition_series_attributes: {
                  id: series.id,
                  competition_ids: [partner_competition.id, competition.id].join(","),
                },
              },
            }
            follow_redirect!
            expect(response).to be_successful

            competition.reload

            expect(competition.part_of_competition_series?).to eq false
            expect(competition.series_sibling_competitions.count).to eq 0
          end

          it 'cannot add competition to a new Series' do
            expect(competition.confirmed?).to be true
            partner_competition.update!(competition_series_id: nil)

            patch competition_path(competition), params: {
              competition: {
                competition_series_attributes: {
                  wcif_id: "SomeNewSeries2015",
                  name: "Some New Series 2015",
                  short_name: "Some New Series 2015",
                  competition_ids: [partner_competition.id, competition.id].join(","),
                },
              },
            }
            follow_redirect!
            expect(response).to be_successful

            competition.reload

            expect(competition.part_of_competition_series?).to eq false
            expect(competition.series_sibling_competitions.count).to eq 0
          end

          it 'cannot remove competition from an existing Series' do
            competition.update!(competition_series: series)
            expect(competition.confirmed?).to be true

            patch competition_path(competition), params: {
              competition: {
                competition_series_attributes: {
                  id: series.id,
                  _destroy: true,
                },
              },
            }
            follow_redirect!
            expect(response).to be_successful

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

  describe "WCIF endpoint caching" do
    # TODO: Figure out how to enable caching in this context only (change Rails.application.config.cache_store = :memory_cache didn't work)
    context 'enable caching' do
      before do
        @competition = FactoryBot.create(:competition, :with_delegate, :visible, :with_valid_schedule)
      end
      sign_in { FactoryBot.create :admin }
      let(:cache_key) { "wcif/#{@competition.id}" }
      let(:comp_name) { @competition.name }

      it 'does not start with a warmed cache, but cache exists after wcif_public call' do
        expect(Rails.cache.read(cache_key.to_s)).to be nil

        get api_v0_competition_wcif_public_path(@competition)

        expect(response.status).to be(200)
        expect(Rails.cache.read(cache_key.to_s)).not_to be_nil
      end

      it 'refreshes the cache after an update to comp data' do
        expect(Rails.cache.read(cache_key.to_s)).to be nil
        get api_v0_competition_wcif_public_path(@competition)
        expect(Rails.cache.read(cache_key)["name"]).to eq comp_name

        new_comp_name = "New name for competition 2022"
        patch competition_path(@competition), params:
          {
            'competition[name]' => new_comp_name,
            'competition[staff_delegate_ids]' => @competition.staff_delegate_ids,
            'commit' => 'Confirm',
          }
        expect(Competition.find(@competition.id).name).to eq new_comp_name
        expect(Rails.cache.read(cache_key)["name"]).to eq new_comp_name
      end

      it 'identical payloads from manual cache update WCIF and show_wcif_public' do
        expect(Rails.cache.read(cache_key.to_s)).to be nil
        get api_v0_competition_wcif_public_path(@competition)
        expect(Rails.cache.read(cache_key)["name"]).to eq comp_name

        new_comp_name = "Another name for competition 2022"
        patch competition_path(@competition), params:
          {
            'competition[name]' => new_comp_name,
            'competition[staff_delegate_ids]' => @competition.staff_delegate_ids,
            'commit' => 'Confirm',
          }

        # wcif_payload = Competition.find()
      end

      it 'show_public_wcif endpoint returns updated cache data' do
      end
    end
  end
end
