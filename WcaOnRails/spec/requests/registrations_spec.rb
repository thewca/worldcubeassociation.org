# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.describe "registrations" do
  let!(:competition) { FactoryBot.create(:competition, :with_delegate, :visible, event_ids: %w(333 444)) }

  describe "POST #do_import" do
    before do
      sign_in competition.delegates.first
    end

    it "redirects when WCA registration is used" do
      competition.update!(use_wca_registration: true)
      post competition_registrations_do_import_path(competition)
      expect(response).to redirect_to competition_path(competition)
    end

    it "renders an error when there are missing columns" do
      file = csv_file [
        ["Status", "Name", "WCA ID", "Birth date", "Gender", "Email", "444"],
      ]
      post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
      follow_redirect!
      expect(response.body).to include "Missing columns: country and 333."
    end

    it "renders an error when the number of accepted registrations exceeds competitor limit" do
      competition.update!(competitor_limit: 1, competitor_limit_enabled: true, competitor_limit_reason: "Testing!")
      file = csv_file [
        ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
        ["a", "Sherlock Holmes", "United Kingdom", "", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
        ["a", "John Watson", "United Kingdom", "", "2000-01-01", "m", "watson@example.com", "1", "1"],
      ]
      expect {
        post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
      }.to_not change { competition.registrations.count }
      follow_redirect!
      expect(response.body).to include "The given file includes 2 accepted registrations, which is more than the competitor limit of 1."
    end

    describe "registrations import" do
      context "registrant has WCA ID" do
        it "renders an error if the WCA ID doesn't exist" do
          expect(RegistrationsMailer).to_not receive(:notify_registrant_of_locked_account_creation)
          file = csv_file [
            ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
            ["a", "Sherlock Holmes", "United Kingdom", "1000DARN99", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
          ]
          expect {
            post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
          }.to_not change { competition.registrations.count }
          follow_redirect!
          expect(response.body).to include "Non-existent WCA ID given 1000DARN99."
        end

        context "user exists with the given WCA ID" do
          context "the user is a dummy account" do
            let!(:dummy_user) { FactoryBot.create(:dummy_user) }

            context "user exists with registrant's email" do
              context "the user already has WCA ID" do
                it "renders an error" do
                  user = FactoryBot.create(:user, :wca_id)
                  file = csv_file [
                    ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
                    ["a", "Sherlock Holmes", "United Kingdom", dummy_user.wca_id, "2000-01-01", "m", user.email, "1", "0"],
                  ]
                  expect {
                    post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
                  }.to_not change { competition.registrations.count }
                  follow_redirect!
                  expect(response.body).to include "There is already a user with email #{user.email}, but it has WCA ID of #{user.wca_id} instead of #{dummy_user.wca_id}."
                end
              end

              context "the user doesn't have WCA ID" do
                it "merges the user with the dummy one and registers him" do
                  user = FactoryBot.create(:user)
                  file = csv_file [
                    ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
                    ["a", "Sherlock Holmes", "United Kingdom", dummy_user.wca_id, "2000-01-01", "m", user.email, "1", "0"],
                  ]
                  expect {
                    post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
                  }.to change { User.count }.by(-1)
                  expect(User.exists?(dummy_user.id)).to be false
                  user.reload
                  expect(user.wca_id).to eq dummy_user.wca_id
                  expect(user.registrations.first.events.map(&:id)).to eq %w(333)
                  expect(competition.registrations.count).to eq 1
                end
              end
            end

            context "no user exists with registrant's email" do
              it "promotes the dummy user to a locked one, registers and notifies him" do
                expect(RegistrationsMailer).to receive(:notify_registrant_of_locked_account_creation)
                file = csv_file [
                  ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
                  ["a", "Sherlock Holmes", "United Kingdom", dummy_user.wca_id, "2000-01-01", "m", "sherlock@example.com", "1", "0"],
                ]
                expect {
                  post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
                }.to_not change { User.count }
                user = dummy_user.reload
                expect(user).to_not be_dummy_account
                expect(user).to be_locked_account
                expect(user.email).to eq "sherlock@example.com"
                expect(user.registrations.first.events.map(&:id)).to eq %w(333)
                expect(competition.registrations.count).to eq 1
              end
            end
          end

          context "the user is not a dummy account" do
            it "registers this user" do
              user = FactoryBot.create(:user, :wca_id)
              file = csv_file [
                ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
                ["a", "Sherlock Holmes", "United Kingdom", user.wca_id, "2000-01-01", "m", "sherlock@example.com", "1", "0"],
              ]
              expect {
                post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
              }.to_not change { User.count }
              expect(user.registrations.first.events.map(&:id)).to eq %w(333)
              expect(competition.registrations.count).to eq 1
            end
          end
        end

        context "no user exists with the given WCA ID" do
          context "user exists with registrant's email" do
            context "the user has unconfirmed WCA ID different from the given WCA ID" do
              it "renders an error" do
                person = FactoryBot.create(:person)
                unconfirmed_person = FactoryBot.create(:person)
                user = FactoryBot.create(
                  :user,
                  unconfirmed_wca_id: unconfirmed_person.wca_id,
                  dob_verification: unconfirmed_person.dob,
                  delegate_to_handle_wca_id_claim: User.delegates.first,
                )
                file = csv_file [
                  ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
                  ["a", "Sherlock Holmes", "United Kingdom", person.wca_id, "2000-01-01", "m", user.email, "1", "0"],
                ]
                expect {
                  post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
                }.to_not change { competition.registrations.count }
                follow_redirect!
                expect(response.body).to include "There is already a user with email #{user.email}, but it has unconfirmed WCA ID of #{unconfirmed_person.wca_id} instead of #{person.wca_id}."
              end
            end

            context "the user has unconfirmed WCA ID same as the given WCA ID" do
              it "claims the WCA ID and registers the user" do
                person = FactoryBot.create(:person)
                user = FactoryBot.create(:user)
                file = csv_file [
                  ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
                  ["a", "Sherlock Holmes", "United Kingdom", person.wca_id, "2000-01-01", "m", user.email, "1", "0"],
                ]
                expect {
                  post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
                }.to_not change { User.count }
                expect(user.reload.wca_id).to eq person.wca_id
                expect(user.reload.unconfirmed_wca_id).to be_nil
                expect(user.reload.delegate_to_handle_wca_id_claim).to be_nil
                expect(user.registrations.first.events.map(&:id)).to eq %w(333)
                expect(competition.registrations.count).to eq 1
              end
            end

            context "the user has no unconfirmed WCA ID" do
              it "updates this user with the WCA ID and registers him" do
                person = FactoryBot.create(:person)
                user = FactoryBot.create(:user)
                file = csv_file [
                  ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
                  ["a", "Sherlock Holmes", "United Kingdom", person.wca_id, "2000-01-01", "m", user.email, "1", "0"],
                ]
                expect {
                  post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
                }.to_not change { User.count }
                expect(user.reload.wca_id).to eq person.wca_id
                expect(user.registrations.first.events.map(&:id)).to eq %w(333)
                expect(competition.registrations.count).to eq 1
              end
            end
          end

          context "no user exists with registrant's email" do
            it "creates a locked user with this WCA ID, registers and notifies him" do
              expect(RegistrationsMailer).to receive(:notify_registrant_of_locked_account_creation)
              person = FactoryBot.create(:person)
              file = csv_file [
                ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
                ["a", "Sherlock Holmes", "United Kingdom", person.wca_id, "2000-01-01", "m", "sherlock@example.com", "1", "0"],
              ]
              expect {
                post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
              }.to change { User.count }.by(1)
              user = competition.registrations.first.user
              expect(user.wca_id).to eq person.wca_id
              expect(user).to be_locked_account
            end
          end
        end
      end

      context "registrant doesn't have WCA ID" do
        context "user exists with registrant's email" do
          it "registers this user" do
            user = FactoryBot.create(:user)
            file = csv_file [
              ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
              ["a", "Sherlock Holmes", "United Kingdom", "", "2000-01-01", "m", user.email, "1", "0"],
            ]
            expect {
              post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
            }.to_not change { User.count }
            expect(user.registrations.first.events.map(&:id)).to eq %w(333)
            expect(competition.registrations.count).to eq 1
          end

          it "updates user data unless it has WCA ID" do
            user = FactoryBot.create(:user)
            file = csv_file [
              ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
              ["a", "Sherlock Holmes", "United Kingdom", "", "2000-01-01", "m", user.email, "1", "0"],
            ]
            expect {
              post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
            }.to_not change { User.count }
            expect(user.reload.name).to eq "Sherlock Holmes"
            expect(user.dob).to eq Date.new(2000, 1, 1)
            expect(user.country_iso2).to eq "GB"
          end
        end

        context "no user exists with registrant's email" do
          it "creates a locked user without WCA ID, registers and notifies him" do
            expect(RegistrationsMailer).to receive(:notify_registrant_of_locked_account_creation)
            file = csv_file [
              ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
              ["a", "Sherlock Holmes", "United Kingdom", "", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
            ]
            expect {
              post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
            }.to change { User.count }.by(1)
            user = competition.registrations.first.user
            expect(user.wca_id).to be_blank
            expect(user).to be_locked_account
          end
        end
      end
    end

    describe "registrations re-import" do
      context "CSV registrant already accepted in the database" do
        it "leaves existing registration unchanged" do
          registration = FactoryBot.create(:registration, :accepted, competition: competition, events: %w(333))
          user = registration.user
          file = csv_file [
            ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
            ["a", user.name, user.country.name, "", user.dob, user.gender, user.email, "1", "0"],
          ]
          expect {
            post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
          }.to not_change { competition.registrations.count }
            .and not_change { registration.reload.accepted_at }
        end
      end

      context "CSV registrant already accepted in the database, but with different events" do
        it "only updates registration events" do
          registration = FactoryBot.create(:registration, :accepted, competition: competition, events: %(333))
          user = registration.user
          file = csv_file [
            ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
            ["a", user.name, user.country.name, "", user.dob, user.gender, user.email, "1", "1"],
          ]
          expect {
            post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
          }.to not_change { competition.registrations.count }
            .and not_change { registration.reload.accepted_at }
            .and change { registration.reload.events.map(&:id) }.from(%w(333)).to(%w(333 444))
        end
      end

      context "CSV registrant already in the database, but deleted" do
        it "acceptes the registration again" do
          registration = FactoryBot.create(:registration, :deleted, competition: competition)
          user = registration.user
          file = csv_file [
            ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
            ["a", user.name, user.country.name, "", user.dob, user.gender, user.email, "1", "0"],
          ]
          expect {
            post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
          }.to not_change { competition.registrations.count }
            .and change { registration.reload.accepted_at }
          expect(registration.reload).to be_accepted
        end
      end

      context "registrant deleted in the database, but not in the CSV file" do
        it "leaves the registration unchanged" do
          registration = FactoryBot.create(:registration, :deleted, competition: competition)
          file = csv_file [
            ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ]
          expect {
            post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
          }.to not_change { competition.registrations.count }
            .and not_change { registration.reload.deleted_at }
          expect(registration.reload).to be_deleted
        end
      end

      context "registrant accepted in the database, but not in the CSV file" do
        it "deletes the registration" do
          registration = FactoryBot.create(:registration, :accepted, competition: competition)
          file = csv_file [
            ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ]
          expect {
            post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
          }.to not_change { User.count }
            .and not_change { competition.registrations.count }
            .and change { competition.registrations.accepted.count }.by(-1)
          expect(registration.reload).to be_deleted
        end
      end

      context "CSV registrant not in the database" do
        it "creates a new registration registration" do
          file = csv_file [
            ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
            ["a", "Sherlock Holmes", "United Kingdom", "", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
          ]
          expect {
            post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
          }.to change { competition.registrations.count }.by(1)
        end
      end
    end
  end
end

def csv_file(lines)
  temp_file = Tempfile.new ["registrations", ".csv"]
  CSV.open(temp_file.path, "w") do |csv|
    lines.each { |line| csv << line }
  end
  Rack::Test::UploadedFile.new(temp_file.path, "text/csv")
end
