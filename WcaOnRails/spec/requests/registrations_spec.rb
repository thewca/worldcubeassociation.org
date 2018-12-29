# frozen_string_literal: true

require "rails_helper"

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

    it "redirects when the competition has registrations" do
      FactoryBot.create(:registration, competition: competition)
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

    describe "user import" do
      context "registrant has WCA ID" do
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
  end
end

def csv_file(lines)
  temp_file = Tempfile.new ["registrations", ".csv"]
  CSV.open(temp_file.path, "w") do |csv|
    lines.each { |line| csv << line }
  end
  Rack::Test::UploadedFile.new(temp_file.path, "text/csv")
end
