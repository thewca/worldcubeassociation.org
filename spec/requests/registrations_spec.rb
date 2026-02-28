# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.describe "registrations" do
  let!(:competition) { create(:competition, :with_delegate, :future, :visible, event_ids: %w[333 444]) }

  describe "POST #do_import" do
    context "when signed in as a normal user" do
      it "doesn't allow access" do
        sign_in create(:user)
        post competition_registrations_do_import_path(competition)
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as competition manager" do
      before do
        sign_in competition.delegates.first
      end

      it "redirects when WCA registration is used" do
        competition.update!(use_wca_registration: true)
        post competition_registrations_do_import_path(competition)
        expect(response).to redirect_to competition_path(competition)
      end

      it "renders an error when registrations is not an array" do
        post competition_registrations_do_import_path(competition), params: { registrations: "not_an_array" }, as: :json
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["error"]).to eq "Expected array of registrations"
      end

      it "renders an error when there are invalid country codes" do
        registrations = [
          { name: "Sherlock Holmes", countryIso2: "XX", wcaId: "", birthdate: "2000-01-01", gender: "m", email: "sherlock@example.com", registration: { eventIds: ["333"] } },
        ]
        expect do
          post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
        end.not_to(change { competition.registrations.count })
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "Invalid country codes: XX"
      end

      it "renders an error when there are invalid event IDs" do
        registrations = [
          { name: "Sherlock Holmes", countryIso2: "GB", wcaId: "", birthdate: "2000-01-01", gender: "m", email: "sherlock@example.com", registration: { eventIds: ["999"] } },
        ]
        expect do
          post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
        end.not_to(change { competition.registrations.count })
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "Invalid event IDs for this competition: 999"
      end

      it "renders an error when the number of accepted registrations exceeds competitor limit" do
        competition.update!(competitor_limit: 1, competitor_limit_enabled: true, competitor_limit_reason: "Testing!")
        registrations = [
          { name: "Sherlock Holmes", countryIso2: "GB", wcaId: "", birthdate: "2000-01-01", gender: "m", email: "sherlock@example.com", registration: { eventIds: ["333"] } },
          { name: "John Watson", countryIso2: "GB", wcaId: "", birthdate: "2000-01-01", gender: "m", email: "watson@example.com", registration: { eventIds: %w[333 444] } },
        ]
        expect do
          post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
        end.not_to(change { competition.registrations.count })
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "The given file includes 2 accepted registrations, which is more than the competitor limit of 1."
      end

      it "renders an error when there are active registrations for other Series competitions" do
        two_timer_dave = create(:user, :wca_id, name: "Two Timer Dave")

        series = create(:competition_series)
        competition.update!(competition_series: series)

        partner_competition = create(:competition, :with_delegate, :visible, event_ids: %w[333 555],
                                                                             competition_series: series, series_base: competition)

        # make sure there is a dummy registration for the partner competition.
        create(:registration, :accepted, competition: partner_competition, user: two_timer_dave)

        registrations = [
          { name: two_timer_dave.name, countryIso2: two_timer_dave.country.iso2, wcaId: two_timer_dave.wca_id,
            birthdate: two_timer_dave.dob.to_s, gender: two_timer_dave.gender, email: two_timer_dave.email,
            registration: { eventIds: %w[333 444] } },
        ]
        expect do
          post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
        end.not_to(change { competition.registrations.count })
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "Error importing #{two_timer_dave.name}: Validation failed: Competition You can only be accepted for one Series competition at a time."
      end

      it "renders an error when there are email duplicates" do
        registrations = [
          { name: "Sherlock Holmes", countryIso2: "GB", wcaId: "", birthdate: "2000-01-01", gender: "m", email: "sherlock@example.com", registration: { eventIds: ["333"] } },
          { name: "John Watson", countryIso2: "GB", wcaId: "", birthdate: "2000-01-01", gender: "m", email: "sherlock@example.com", registration: { eventIds: %w[333 444] } },
        ]
        expect do
          post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
        end.not_to(change { competition.registrations.count })
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "Email must be unique, found the following duplicates: sherlock@example.com."
      end

      it "renders an error when there are WCA ID duplicates" do
        registrations = [
          { name: "Sherlock Holmes", countryIso2: "GB", wcaId: "2019HOLM01", birthdate: "2000-01-01", gender: "m", email: "sherlock@example.com", registration: { eventIds: ["333"] } },
          { name: "John Watson", countryIso2: "GB", wcaId: "2019HOLM01", birthdate: "2000-01-01", gender: "m", email: "watson@example.com", registration: { eventIds: %w[333 444] } },
        ]
        expect do
          post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
        end.not_to(change { competition.registrations.count })
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "WCA ID must be unique, found the following duplicates: 2019HOLM01."
      end

      it "renders an error when there are invalid DOBs" do
        registrations = [
          { name: "Sherlock Holmes", countryIso2: "GB", wcaId: "2019HOLM01", birthdate: "01.01.2000", gender: "m", email: "sherlock@example.com", registration: { eventIds: ["333"] } },
          { name: "John Watson", countryIso2: "GB", wcaId: "2019WATS01", birthdate: "2000-01-01", gender: "m", email: "watson@example.com", registration: { eventIds: %w[333 444] } },
          { name: "James Moriarty", countryIso2: "GB", wcaId: "2019MORI01", birthdate: "Jan 01 2000", gender: "m", email: "moriarty@example.com", registration: { eventIds: ["444"] } },
        ]
        expect do
          post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
        end.not_to(change { competition.registrations.count })
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "Birthdate must follow the YYYY-mm-dd format (year-month-day, for example 1944-07-13), found the following dates which cannot be parsed: 01.01.2000, Jan 01 2000."
      end

      describe "registrations import" do
        context "registrant has WCA ID" do
          it "renders an error if the WCA ID doesn't exist" do
            expect(RegistrationsMailer).not_to receive(:notify_registrant_of_locked_account_creation)
            registrations = [
              { name: "Sherlock Holmes", countryIso2: "GB", wcaId: "1000DARN99", birthdate: "2000-01-01", gender: "m", email: "sherlock@example.com", registration: { eventIds: ["333"] } },
            ]
            expect do
              post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
            end.not_to(change { competition.registrations.count })
            expect(response).to have_http_status(:unprocessable_content)
            expect(response.body).to match(/The WCA ID 1000DARN99 doesn.*t exist/)
          end

          context "user exists with the given WCA ID" do
            context "the user is a dummy account" do
              let!(:dummy_user) { create(:dummy_user) }

              context "user exists with registrant's email" do
                context "the user already has WCA ID" do
                  it "renders an error" do
                    user = create(:user, :wca_id)
                    registrations = [
                      { name: dummy_user.name, countryIso2: dummy_user.country.iso2, wcaId: dummy_user.wca_id,
                        birthdate: dummy_user.dob.to_s, gender: dummy_user.gender, email: user.email,
                        registration: { eventIds: ["333"] } },
                    ]
                    expect do
                      post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
                    end.not_to(change { competition.registrations.count })
                    expect(response).to have_http_status(:unprocessable_content)
                    expect(response.body).to include "There is already a user with email #{user.email}, but it has WCA ID of #{user.wca_id} instead of #{dummy_user.wca_id}."
                  end
                end

                context "the user doesn't have WCA ID" do
                  it "merges the user with the dummy one and registers him" do
                    user = create(:user)
                    registrations = [
                      { name: dummy_user.name, countryIso2: dummy_user.country.iso2, wcaId: dummy_user.wca_id,
                        birthdate: dummy_user.dob.to_s, gender: dummy_user.gender, email: user.email,
                        registration: { eventIds: ["333"] } },
                    ]
                    expect do
                      post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
                    end.to change(User, :count).by(-1)
                    expect(User.exists?(dummy_user.id)).to be false
                    user.reload
                    expect(user.wca_id).to eq dummy_user.wca_id
                    expect(user.registrations.first.events.map(&:id)).to eq %w[333]
                    expect(competition.registrations.count).to eq 1
                  end
                end
              end

              context "no user exists with registrant's email" do
                it "promotes the dummy user to a locked one, registers and notifies him" do
                  expect(RegistrationsMailer).to receive(:notify_registrant_of_locked_account_creation)
                  registrations = [
                    { name: dummy_user.name, countryIso2: dummy_user.country.iso2, wcaId: dummy_user.wca_id,
                      birthdate: dummy_user.dob.to_s, gender: dummy_user.gender, email: "sherlock@example.com",
                      registration: { eventIds: ["333"] } },
                  ]
                  expect do
                    post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
                  end.not_to change(User, :count)
                  user = dummy_user.reload
                  expect(user).not_to be_dummy_account
                  expect(user).to be_locked_account
                  expect(user.email).to eq "sherlock@example.com"
                  expect(user.registrations.first.events.map(&:id)).to eq %w[333]
                  expect(competition.registrations.count).to eq 1
                end
              end
            end

            context "the user is not a dummy account" do
              it "registers this user" do
                user = create(:user, :wca_id)
                registrations = [
                  { name: user.name, countryIso2: user.country.iso2, wcaId: user.wca_id,
                    birthdate: user.dob.to_s, gender: user.gender, email: "sherlock@example.com",
                    registration: { eventIds: ["333"] } },
                ]
                expect do
                  post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
                end.not_to change(User, :count)
                expect(user.registrations.first.events.map(&:id)).to eq %w[333]
                expect(competition.registrations.count).to eq 1
              end
            end
          end

          context "no user exists with the given WCA ID" do
            context "user exists with registrant's email" do
              context "the user has unconfirmed WCA ID different from the given WCA ID" do
                it "renders an error" do
                  person = create(:person)
                  unconfirmed_person = create(:person)
                  delegate = create(:delegate_role)
                  user = create(
                    :user,
                    unconfirmed_wca_id: unconfirmed_person.wca_id,
                    dob_verification: unconfirmed_person.dob,
                    delegate_to_handle_wca_id_claim: delegate.user,
                  )
                  registrations = [
                    { name: person.name, countryIso2: person.country.iso2, wcaId: person.wca_id,
                      birthdate: person.dob.to_s, gender: person.gender, email: user.email,
                      registration: { eventIds: ["333"] } },
                  ]
                  expect do
                    post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
                  end.not_to(change { competition.registrations.count })
                  expect(response).to have_http_status(:unprocessable_content)
                  expect(response.body).to include "There is already a user with email #{user.email}, but it has unconfirmed WCA ID of #{unconfirmed_person.wca_id} instead of #{person.wca_id}."
                end
              end

              context "the user has unconfirmed WCA ID same as the given WCA ID" do
                it "claims the WCA ID and registers the user" do
                  person = create(:person)
                  delegate = create(:delegate_role)
                  user = create(
                    :user,
                    unconfirmed_wca_id: person.wca_id,
                    dob_verification: person.dob,
                    delegate_to_handle_wca_id_claim: delegate.user,
                  )
                  registrations = [
                    { name: person.name, countryIso2: person.country.iso2, wcaId: person.wca_id,
                      birthdate: person.dob.to_s, gender: person.gender, email: user.email,
                      registration: { eventIds: ["333"] } },
                  ]
                  expect do
                    post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
                  end.not_to change(User, :count)
                  expect(user.reload.wca_id).to eq person.wca_id
                  expect(user.reload.unconfirmed_wca_id).to be_nil
                  expect(user.reload.delegate_to_handle_wca_id_claim).to be_nil
                  expect(user.registrations.first.events.map(&:id)).to eq %w[333]
                  expect(competition.registrations.count).to eq 1
                end
              end

              context "the user has no unconfirmed WCA ID" do
                it "updates this user with the WCA ID and registers him" do
                  person = create(:person)
                  user = create(:user)
                  registrations = [
                    { name: person.name, countryIso2: person.country.iso2, wcaId: person.wca_id,
                      birthdate: person.dob.to_s, gender: person.gender, email: user.email,
                      registration: { eventIds: ["333"] } },
                  ]
                  expect do
                    post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
                  end.not_to change(User, :count)
                  expect(user.reload.wca_id).to eq person.wca_id
                  expect(user.registrations.first.events.map(&:id)).to eq %w[333]
                  expect(competition.registrations.count).to eq 1
                end
              end
            end

            context "no user exists with registrant's email" do
              it "creates a locked user with this WCA ID, registers and notifies him" do
                expect(RegistrationsMailer).to receive(:notify_registrant_of_locked_account_creation)
                person = create(:person)
                registrations = [
                  { name: person.name, countryIso2: person.country.iso2, wcaId: person.wca_id,
                    birthdate: person.dob.to_s, gender: person.gender, email: "sherlock@example.com",
                    registration: { eventIds: ["333"] } },
                ]
                expect do
                  post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
                end.to change(User, :count).by(1)
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
              user = create(:user)
              registrations = [
                { name: "Sherlock Holmes", countryIso2: "GB", wcaId: "", birthdate: "2000-01-01", gender: "m", email: user.email, registration: { eventIds: ["333"] } },
              ]
              expect do
                post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
              end.not_to change(User, :count)
              expect(user.registrations.first.events.map(&:id)).to eq %w[333]
              expect(competition.registrations.count).to eq 1
            end

            it "updates user data unless it has WCA ID" do
              user = create(:user)
              registrations = [
                { name: "Sherlock Holmes", countryIso2: "GB", wcaId: "", birthdate: "2000-01-01", gender: "m", email: user.email, registration: { eventIds: ["333"] } },
              ]
              expect do
                post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
              end.not_to change(User, :count)
              expect(user.reload.name).to eq "Sherlock Holmes"
              expect(user.dob).to eq Date.new(2000, 1, 1)
              expect(user.country_iso2).to eq "GB"
            end
          end

          context "no user exists with registrant's email" do
            it "creates a locked user without WCA ID, registers and notifies him" do
              expect(RegistrationsMailer).to receive(:notify_registrant_of_locked_account_creation)
              registrations = [
                { name: "Sherlock Holmes", countryIso2: "GB", wcaId: "", birthdate: "2000-01-01", gender: "m", email: "sherlock@example.com", registration: { eventIds: ["333"] } },
              ]
              expect do
                post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
              end.to change(User, :count).by(1)
              user = competition.registrations.first.user
              expect(user.wca_id).to be_blank
              expect(user).to be_locked_account
            end
          end
        end
      end

      describe "registrations re-import" do
        context "registrant already accepted in the database" do
          it "leaves existing registration unchanged" do
            registration = create(:registration, :accepted, competition: competition, events: %w[333])
            user = registration.user
            registrations = [
              { name: user.name, countryIso2: user.country.iso2, wcaId: "", birthdate: user.dob.to_s, gender: user.gender, email: user.email, registration: { eventIds: ["333"] } },
            ]
            expect do
              post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
            end.to not_change { competition.registrations.count }
              .and(not_change { registration.reload.competing_status })
          end
        end

        context "registrant already accepted in the database, but with different events" do
          it "only updates registration events" do
            registration = create(:registration, :accepted, competition: competition, events: %(333))
            user = registration.user
            registrations = [
              { name: user.name, countryIso2: user.country.iso2, wcaId: "", birthdate: user.dob.to_s, gender: user.gender, email: user.email, registration: { eventIds: %w[333 444] } },
            ]
            expect do
              post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
            end.to not_change { competition.registrations.count }
              .and not_change { registration.reload.competing_status }
              .and change { registration.reload.events.map(&:id) }.from(%w[333]).to(%w[333 444])
          end
        end

        context "registrant already in the database, but deleted" do
          it "accepts the registration again" do
            registration = create(:registration, :cancelled, competition: competition)
            user = registration.user
            registrations = [
              { name: user.name, countryIso2: user.country.iso2, wcaId: "", birthdate: user.dob.to_s, gender: user.gender, email: user.email, registration: { eventIds: ["333"] } },
            ]
            expect do
              post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
            end.to not_change { competition.registrations.count }
              .and(change { registration.reload.competing_status })
            expect(registration.reload).to be_accepted
          end
        end

        context "registrant deleted in the database, but not in the import data" do
          it "leaves the registration unchanged" do
            registration = create(:registration, :cancelled, competition: competition)
            other_user = create(:user)
            registrations = [
              { name: other_user.name, countryIso2: other_user.country.iso2, wcaId: "", birthdate: other_user.dob.to_s, gender: other_user.gender, email: other_user.email, registration: { eventIds: ["333"] } },
            ]
            expect do
              post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
            end.to change { competition.registrations.count }.by(1).and(not_change { registration.reload.competing_status })
            expect(registration.reload).to be_cancelled
          end
        end

        context "registrant accepted in the database, but not in the import data" do
          it "cancels the registration" do
            registration1 = create(:registration, :accepted, competition: competition, events: %w[333])
            registration2 = create(:registration, :accepted, competition: competition, events: %w[444])
            registrations = [
              { name: registration1.user.name, countryIso2: registration1.user.country.iso2, wcaId: "",
                birthdate: registration1.user.dob.to_s, gender: registration1.user.gender, email: registration1.user.email,
                registration: { eventIds: ["333"] } },
            ]
            expect do
              post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
            end.to not_change { User.count }
              .and not_change { competition.registrations.count }
              .and change { competition.registrations.accepted.count }.by(-1)
            expect(registration2.reload).to be_cancelled
          end
        end

        context "registrant not in the database" do
          it "creates a new registration" do
            registrations = [
              { name: "Sherlock Holmes", countryIso2: "GB", wcaId: "", birthdate: "2000-01-01", gender: "m", email: "sherlock@example.com", registration: { eventIds: ["333"] } },
            ]
            expect do
              post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
            end.to change { competition.registrations.count }.by(1)
          end
        end

        context "empty registrations array" do
          it "throws an error" do
            registrations = []
            expect do
              post competition_registrations_do_import_path(competition), params: { registrations: registrations }, as: :json
            end.to raise_error(ActionController::ParameterMissing)
          end
        end
      end
    end
  end

  describe "POST #validate_and_convert_registrations" do
    context "when signed in as a normal user" do
      it "doesn't allow access" do
        sign_in create(:user)
        post competition_registrations_validate_and_convert_path(competition)
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as competition manager" do
      before do
        sign_in competition.delegates.first
      end

      it "redirects when WCA registration is used" do
        competition.update!(use_wca_registration: true)
        post competition_registrations_validate_and_convert_path(competition)
        expect(response).to redirect_to competition_path(competition)
      end

      it "renders an error when there are missing columns" do
        file = csv_file [
          ["Status", "Name", "WCA ID", "Birth date", "Gender", "Email", "444"],
          ["a", "Sherlock Holmes", "", "2000-01-01", "m", "sherlock@example.com", "1"],
        ]
        post competition_registrations_validate_and_convert_path(competition), params: { csv_registration_file: file }
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "Missing columns: country, 333."
      end

      it "renders an error when the number of accepted registrations exceeds competitor limit" do
        competition.update!(competitor_limit: 1, competitor_limit_enabled: true, competitor_limit_reason: "Testing!")
        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ["a", "Sherlock Holmes", "United Kingdom", "", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
          ["a", "John Watson", "United Kingdom", "", "2000-01-01", "m", "watson@example.com", "1", "1"],
        ]
        post competition_registrations_validate_and_convert_path(competition), params: { csv_registration_file: file }
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "The given file includes 2 accepted registrations, which is more than the competitor limit of 1."
      end

      it "renders an error when there are email duplicates" do
        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ["a", "Sherlock Holmes", "United Kingdom", "", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
          ["a", "John Watson", "United Kingdom", "", "2000-01-01", "m", "sherlock@example.com", "1", "1"],
        ]
        post competition_registrations_validate_and_convert_path(competition), params: { csv_registration_file: file }
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "Email must be unique, found the following duplicates: sherlock@example.com."
      end

      it "renders an error when there are WCA ID duplicates" do
        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ["a", "Sherlock Holmes", "United Kingdom", "2019HOLM01", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
          ["a", "John Watson", "United Kingdom", "2019HOLM01", "2000-01-01", "m", "watson@example.com", "1", "1"],
        ]
        post competition_registrations_validate_and_convert_path(competition), params: { csv_registration_file: file }
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "WCA ID must be unique, found the following duplicates: 2019HOLM01."
      end

      it "renders an error when there are invalid DOBs" do
        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ["a", "Sherlock Holmes", "United Kingdom", "2019HOLM01", "01.01.2000", "m", "sherlock@example.com", "1", "0"],
          ["a", "John Watson", "United Kingdom", "2019WATS01", "2000-01-01", "m", "watson@example.com", "1", "1"],
          ["a", "James Moriarty", "United Kingdom", "2019MORI01", "Jan 01 2000", "m", "moriarty@example.com", "0", "1"],
        ]
        post competition_registrations_validate_and_convert_path(competition), params: { csv_registration_file: file }
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "Birthdate must follow the YYYY-mm-dd format (year-month-day, for example 1944-07-13), found the following dates which cannot be parsed: 01.01.2000, Jan 01 2000."
      end

      it "renders an error when CSV has no accepted rows" do
        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
        ]
        post competition_registrations_validate_and_convert_path(competition), params: { csv_registration_file: file }
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include "The file is empty."
      end

      it "successfully converts valid CSV to JSON registration data" do
        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ["a", "Sherlock Holmes", "United Kingdom", "", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
          ["a", "John Watson", "United Kingdom", "", "2000-01-01", "m", "watson@example.com", "0", "1"],
        ]
        post competition_registrations_validate_and_convert_path(competition), params: { csv_registration_file: file }
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json).to match [
          {
            "name" => "Sherlock Holmes",
            "wcaId" => "",
            "countryIso2" => "GB",
            "gender" => "m",
            "birthdate" => "2000-01-01",
            "email" => "sherlock@example.com",
            "registration" => {
              "eventIds" => ["333"],
              "status" => "accepted",
              "isCompeting" => true,
              "registeredAt" => a_kind_of(String),
            },
          },
          {
            "name" => "John Watson",
            "wcaId" => "",
            "countryIso2" => "GB",
            "gender" => "m",
            "birthdate" => "2000-01-01",
            "email" => "watson@example.com",
            "registration" => {
              "eventIds" => ["444"],
              "status" => "accepted",
              "isCompeting" => true,
              "registeredAt" => a_kind_of(String),
            },
          },
        ]
      end

      it "only includes rows with accepted status" do
        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ["a", "Sherlock Holmes", "United Kingdom", "", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
          ["p", "John Watson", "United Kingdom", "", "2000-01-01", "m", "watson@example.com", "0", "1"],
        ]
        post competition_registrations_validate_and_convert_path(competition), params: { csv_registration_file: file }
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json.length).to eq 1
        expect(json[0]["name"]).to eq "Sherlock Holmes"
      end

      it "uppercases WCA IDs and lowercases emails" do
        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ["a", "Sherlock Holmes", "United Kingdom", "2019holm01", "2000-01-01", "m", "Sherlock@Example.COM", "1", "0"],
        ]
        post competition_registrations_validate_and_convert_path(competition), params: { csv_registration_file: file }
        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json[0]["wcaId"]).to eq "2019HOLM01"
        expect(json[0]["email"]).to eq "sherlock@example.com"
      end
    end
  end

  # Adding a registration reuses the logic behind importing CSV registrations
  # and that's tested thoroughly above.
  describe "POST #do_add" do
    context "when signed in as a normal user" do
      it "doesn't allow access" do
        sign_in create(:user)
        post competition_registrations_do_import_path(competition)
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as competition manager" do
      let(:ots_competition) { create(:competition, :registration_open, :with_delegate, :visible) }

      before do
        sign_in ots_competition.delegates.first
      end

      context "when there is existing registration for the given person" do
        it "renders an error" do
          registration = create(:registration, :accepted, competition: ots_competition, events: %w[333])
          user = registration.user
          expect do
            post competition_registrations_do_add_path(ots_competition), params: {
              registration_data: {
                name: user.name, country: user.country.id, birth_date: user.dob,
                gender: user.gender, email: user.email, event_ids: ["444"]
              },
            }
          end.to(not_change { ots_competition.registrations.count })
          expect(response.body).to include "This person already has a registration."
        end
      end

      context "when there is another registration in the same series" do
        it "renders an error" do
          two_timer_dave = create(:user, name: "Two Timer Dave")

          series = create(:competition_series)
          ots_competition.update!(competition_series: series)

          partner_competition = create(:competition, :with_delegate, :visible, event_ids: %w[333 555],
                                                                               competition_series: series, series_base: ots_competition)

          # make sure there is a dummy registration for the partner competition.
          create(:registration, :accepted, competition: partner_competition, user: two_timer_dave)

          expect do
            post competition_registrations_do_add_path(ots_competition), params: {
              registration_data: {
                name: two_timer_dave.name, country: two_timer_dave.country.id, birth_date: two_timer_dave.dob,
                gender: two_timer_dave.gender, email: two_timer_dave.email, event_ids: ["444"]
              },
            }
          end.not_to(change { ots_competition.registrations.count })
          expect(response.body).to include "You can only be accepted for one Series competition at a time"
        end
      end

      context "when there is no existing registration for the given person" do
        it "creates an accepted registration" do
          expect do
            post competition_registrations_do_add_path(ots_competition), params: {
              registration_data: {
                name: "Sherlock Holmes", country: "United Kingdom", birth_date: "2000-01-01",
                gender: "m", email: "sherlock@example.com", event_ids: ["444"]
              },
            }
          end.to change { ots_competition.registrations.count }.by(1)
          registration = ots_competition.registrations.last
          expect(registration.user.name).to eq "Sherlock Holmes"
          expect(registration.events.map(&:id)).to eq ["444"]
          expect(registration).to be_accepted
          follow_redirect!
          expect(response.body).to include "Successfully added registration!"
        end
      end

      context "when competitor limit has been reached" do
        it "redirects to competition page" do
          create(:registration, :accepted, competition: ots_competition, events: %w[333])
          ots_competition.update!(
            competitor_limit_enabled: true, competitor_limit: 1, competitor_limit_reason: "So I take all the podiums",
          )
          expect do
            post competition_registrations_do_add_path(ots_competition), params: {
              registration_data: {
                name: "Sherlock Holmes", country: "United Kingdom", birth_date: "2000-01-01",
                gender: "m", email: "sherlock@example.com", event_ids: ["444"]
              },
            }
          end.not_to(change { ots_competition.registrations.count })
          follow_redirect!
          expect(response.body).to include "The competitor limit has been reached"
        end
      end

      describe "on the spot behaviour" do
        let(:open_comp) { create(:competition, :registration_open, delegates: [ots_competition.delegates.first]) }
        let(:closed_comp) { create(:competition, :registration_closed, delegates: [ots_competition.delegates.first]) }
        let(:past_comp) { create(:competition, :past, delegates: [ots_competition.delegates.first]) }

        context 'on-the-spot is enabled' do
          it 'works when registration is open' do
            open_comp.update!(on_the_spot_registration: true, on_the_spot_entry_fee_lowest_denomination: 500)

            expect do
              post competition_registrations_do_add_path(open_comp), params: {
                registration_data: {
                  name: "Sherlock Holmes", country: "United Kingdom", birth_date: "2000-01-01",
                  gender: "m", email: "sherlock@example.com", event_ids: ["444"]
                },
              }
            end.to(change { open_comp.registrations.count })
          end

          it 'works when registration is closed' do
            closed_comp.update!(on_the_spot_registration: true, on_the_spot_entry_fee_lowest_denomination: 500)

            expect do
              post competition_registrations_do_add_path(closed_comp), params: {
                registration_data: {
                  name: "Sherlock Holmes", country: "United Kingdom", birth_date: "2000-01-01",
                  gender: "m", email: "sherlock@example.com", event_ids: ["444"]
                },
              }
            end.to(change { closed_comp.registrations.count })
          end

          it 'doesnt work after the end of the competition' do
            past_comp.update!(on_the_spot_registration: true, on_the_spot_entry_fee_lowest_denomination: 500)

            expect do
              post competition_registrations_do_add_path(past_comp), params: {
                registration_data: {
                  name: "Sherlock Holmes", country: "United Kingdom", birth_date: "2000-01-01",
                  gender: "m", email: "sherlock@example.com", event_ids: ["444"]
                },
              }
            end.not_to(change { past_comp.registrations.count })
          end
        end

        context 'on-the-spot is disabled' do
          it 'works when registration is open' do
            expect do
              post competition_registrations_do_add_path(open_comp), params: {
                registration_data: {
                  name: "Sherlock Holmes", country: "United Kingdom", birth_date: "2000-01-01",
                  gender: "m", email: "sherlock@example.com", event_ids: ["444"]
                },
              }
            end.to(change { open_comp.registrations.count })
          end

          it 'doesnt work when registration is closed' do
            expect do
              post competition_registrations_do_add_path(closed_comp), params: {
                registration_data: {
                  name: "Sherlock Holmes", country: "United Kingdom", birth_date: "2000-01-01",
                  gender: "m", email: "sherlock@example.com", event_ids: ["444"]
                },
              }
            end.not_to(change { closed_comp.registrations.count })
          end

          it 'doesnt work after the end of the competition' do
            expect do
              post competition_registrations_do_add_path(past_comp), params: {
                registration_data: {
                  name: "Sherlock Holmes", country: "United Kingdom", birth_date: "2000-01-01",
                  gender: "m", email: "sherlock@example.com", event_ids: ["444"]
                },
              }
            end.not_to(change { past_comp.registrations.count })
          end
        end
      end
    end
  end

  describe "POST #process_payment_intent" do
    context "when not signed in" do
      let(:competition) { create(:competition, :stripe_connected, :visible, :registration_open, events: Event.where(id: %w[222 333])) }
      let!(:user) { create(:user, :wca_id) }
      let!(:registration) { create(:registration, competition: competition, user: user) }

      sign_out

      it "redirects to the sign in page" do
        post registration_payment_intent_path(registration, :stripe)
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in" do
      let(:competition) { create(:competition, :stripe_connected, :visible, :registration_open, events: Event.where(id: %w[222 333]), base_entry_fee_lowest_denomination: 1000) }
      let!(:user) { create(:user, :wca_id) }
      let!(:registration) { create(:registration, competition: competition, user: user) }

      before :each do
        sign_in user
      end

      it "restricts access to the registration's owner" do
        user2 = create(:user, :wca_id)
        registration2 = create(:registration, competition: competition, user: user2)
        post registration_payment_intent_path(registration2.id, :stripe)
        expect(response).to have_http_status :forbidden
      end

      context "with a valid credit card without SCA" do
        it "rejects insufficient payment" do
          outstanding_fees_money = registration.outstanding_entry_fees

          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: outstanding_fees_money / 2,
          }

          expect_error_to_be(response, I18n.t("registrations.payment_form.alerts.amount_too_low"))

          # Should not have created a payment intent in the first place, so assume `payment_intent` to be nil.
          payment_intent = registration.reload.payment_intents.first
          expect(payment_intent).to be_nil
          expect(registration.reload.outstanding_entry_fees).to eq(outstanding_fees_money)
        end

        it "processes sufficient payment when confirmed by redirect" do
          expect(registration.outstanding_entry_fees).to eq competition.base_entry_fee

          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first

          # mimic the user clicking through the interface
          payment_intent.payment_record.confirm_remote_for_test("pm_card_visa")

          # mimic the response that Stripe sends to our return_url after completing the checkout UI
          get registration_payment_completion_path(competition.id, :stripe), params: {
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }

          expect(registration.reload.outstanding_entry_fees).to eq 0
          expect(registration.paid_entry_fees).to eq competition.base_entry_fee
          charge = registration.registration_payments.first.receipt.retrieve_stripe
          expect(charge.amount).to eq competition.base_entry_fee.cents
          expect(charge.receipt_email).to eq user.email
          # Stripe stores everything under "metadata" as string, even if we originally pass in integers
          expect(charge.metadata.competition).to eq competition.id
          expect(charge.metadata.registration_id.to_i).to eq registration.id
          # Check that the website actually records who made the charge
          expect(registration.registration_payments.first.user).to eq user
        end

        it "processes sufficient payment when confirmed by webhook" do
          expect(registration.outstanding_entry_fees).to eq competition.base_entry_fee

          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first
          stripe_account_id = competition.payment_account_for(:stripe).account_id

          # mimic the user clicking through the interface
          payment_intent.payment_record.confirm_remote_for_test("pm_card_visa")

          # mimic the response that Stripe sends to our webhook upon payment completion
          post registration_stripe_webhook_path, params: payment_confirmation_webhook_as_json(
            payment_intent.retrieve_remote.to_hash,
            stripe_account_id,
          )

          expect(registration.reload.outstanding_entry_fees).to eq 0
          expect(registration.paid_entry_fees).to eq competition.base_entry_fee
          charge = registration.registration_payments.first.receipt.retrieve_stripe
          expect(charge.amount).to eq competition.base_entry_fee.cents
          expect(charge.receipt_email).to eq user.email
          # Stripe stores everything under "metadata" as string, even if we originally pass in integers
          expect(charge.metadata.competition).to eq competition.id
          expect(charge.metadata.registration_id.to_i).to eq registration.id
          # Check that the website actually records who made the charge
          expect(registration.registration_payments.first.user).to eq user
        end

        it "processes sufficient payment with donation" do
          donation_lowest_denomination = 100
          payment_amount = registration.outstanding_entry_fees.cents + donation_lowest_denomination

          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: payment_amount,
          }
          payment_intent = registration.reload.payment_intents.first

          # mimic the user clicking through the interface
          payment_intent.payment_record.confirm_remote_for_test("pm_card_visa")

          # mimic the response that Stripe sends to our return_url after completing the checkout UI
          get registration_payment_completion_path(competition.id, :stripe), params: {
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }

          expect(registration.reload.outstanding_entry_fees.cents).to eq(-donation_lowest_denomination)
          expect(registration.paid_entry_fees.cents).to eq payment_amount
          charge = registration.registration_payments.first.receipt.retrieve_stripe
          expect(charge.amount).to eq payment_amount
        end

        it "insert a success in the stripe journal" do
          expect(StripeRecord.count).to eq 0
          expect(PaymentIntent.count).to eq 0

          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first
          expect(payment_intent).not_to be_nil

          # Intent should not be confirmed at this stage, because we have never received a receipt charge from Stripe yet
          expect(payment_intent.confirmed_at).to be_nil
          expect(payment_intent.wca_status).not_to eq('succeeded')

          # mimic the user clicking through the interface
          payment_intent.payment_record.confirm_remote_for_test("pm_card_visa")

          # mimic the response that Stripe sends to our return_url after completing the checkout UI
          get registration_payment_completion_path(competition.id, :stripe), params: {
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }

          stripe_record = payment_intent.reload.payment_record
          # Now we should have a confirmation after calling the return_url hook :)
          expect(payment_intent.confirmed_at).not_to be_nil
          expect(stripe_record).not_to be_nil
          expect(stripe_record.stripe_status).to eq "succeeded"
          metadata = stripe_record.parameters["metadata"]
          expect(metadata["competition"]).to eq competition.id
        end
      end

      context "with a valid 3D-secure credit card" do
        it "asks for further action before recording payment" do
          # The #process_payment_intent endpoint doesn't redirect, it's
          # the 'register' page which does.
          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first

          # NOTE: The PI confirmation sends a redirect code where the user would _normally_ proceed with authentication,
          # but we cannot do that programmatically. So we just take the status quo as "stuck in SCA". (See also comment below)
          expect do
            # mimic the user clicking through the interface
            payment_intent.payment_record.confirm_remote_for_test("pm_card_authenticationRequired")

            # mimic the response that Stripe sends to our return_url after completing the checkout UI
            get registration_payment_completion_path(competition.id, :stripe), params: {
              payment_intent: payment_intent.payment_record.stripe_id,
              payment_intent_client_secret: payment_intent.client_secret,
            }
          end.not_to(change { registration.reload.outstanding_entry_fees })

          expect(registration.paid_entry_fees).to eq 0
          expect(payment_intent.payment_record.reload.stripe_status).to eq('requires_action')
          # That's as far as we can go, testing the authentication success/failure
          # must be done by clicking on a modal.
        end

        it "inserts a 'confirmation pending' event in the stripe journal" do
          expect(StripeRecord.count).to eq 0
          expect(PaymentIntent.count).to eq 0

          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first
          expect(payment_intent).not_to be_nil

          # Intent should not be confirmed at this stage, because we have never received a receipt charge from Stripe yet
          expect(payment_intent.confirmed_at).to be_nil

          # mimic the user clicking through the interface
          payment_intent.payment_record.confirm_remote_for_test("pm_card_authenticationRequired")

          # mimic the response that Stripe sends to our return_url after completing the checkout UI
          get registration_payment_completion_path(competition.id, :stripe), params: {
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }

          stripe_record = payment_intent.reload.payment_record

          # Now we should still wait for the confirmation because SCA hasn't been completed yet
          expect(payment_intent.confirmed_at).to be_nil
          expect(stripe_record).not_to be_nil
          expect(stripe_record.stripe_status).to eq 'requires_action'
          metadata = stripe_record.parameters["metadata"]
          expect(metadata["competition"]).to eq competition.id
        end
      end

      # The tests below are to test that our endpoint correctly forwards errors,
      # not to actually test Stripe's correctness...
      context "rejected credit cards" do
        it "rejects payment with declined credit card" do
          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first

          expect do
            # mimic the user clicking through the interface
            payment_intent.payment_record.confirm_remote_for_test("pm_card_visa_chargeDeclined")
          end.to raise_error(Stripe::StripeError, "Your card was declined.")

          expect do
            # mimick the response that Stripe sends to our return_url after completing the checkout UI
            get registration_payment_completion_path(competition.id, :stripe), params: {
              payment_intent: payment_intent.payment_record.stripe_id,
              payment_intent_client_secret: payment_intent.client_secret,
            }
          end.not_to(change { registration.reload.outstanding_entry_fees })

          expect(registration.paid_entry_fees).to eq 0
          expect(payment_intent.confirmed_at).to be_nil
          expect(payment_intent.payment_record.reload.stripe_status).to eq('requires_payment_method')
          expect(payment_intent.payment_record.error).to eq('card_declined')
        end

        it "rejects payment with expired credit card" do
          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first

          expect do
            # mimic the user clicking through the interface
            payment_intent.payment_record.confirm_remote_for_test("pm_card_visa_chargeDeclinedExpiredCard")
          end.to raise_error(Stripe::StripeError, "Your card has expired.")

          expect do
            # mimick the response that Stripe sends to our return_url after completing the checkout UI
            get registration_payment_completion_path(competition.id, :stripe), params: {
              payment_intent: payment_intent.payment_record.stripe_id,
              payment_intent_client_secret: payment_intent.client_secret,
            }
          end.not_to(change { registration.reload.outstanding_entry_fees })

          expect(registration.paid_entry_fees).to eq 0
          expect(payment_intent.confirmed_at).to be_nil
          expect(payment_intent.payment_record.reload.stripe_status).to eq('requires_payment_method')
          expect(payment_intent.payment_record.error).to eq('expired_card')
        end

        it "rejects payment with incorrect cvc" do
          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first

          expect do
            # mimic the user clicking through the interface
            payment_intent.payment_record.confirm_remote_for_test("pm_card_visa_chargeDeclinedIncorrectCvc")
          end.to raise_error(Stripe::StripeError, "Your card's security code is incorrect.")

          expect do
            # mimick the response that Stripe sends to our return_url after completing the checkout UI
            get registration_payment_completion_path(competition.id, :stripe), params: {
              payment_intent: payment_intent.payment_record.stripe_id,
              payment_intent_client_secret: payment_intent.client_secret,
            }
          end.not_to(change { registration.reload.outstanding_entry_fees })

          expect(registration.paid_entry_fees).to eq 0
          expect(payment_intent.confirmed_at).to be_nil
          expect(payment_intent.payment_record.reload.stripe_status).to eq('requires_payment_method')
          expect(payment_intent.payment_record.error).to eq('incorrect_cvc')
        end

        it "rejects payment due to fraud protection" do
          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first

          expect do
            # mimic the user clicking through the interface
            payment_intent.payment_record.confirm_remote_for_test("pm_card_radarBlock")
          end.to raise_error(Stripe::StripeError, "Your card was declined.")

          expect do
            # mimick the response that Stripe sends to our return_url after completing the checkout UI
            get registration_payment_completion_path(competition.id, :stripe), params: {
              payment_intent: payment_intent.payment_record.stripe_id,
              payment_intent_client_secret: payment_intent.client_secret,
            }
          end.not_to(change { registration.reload.outstanding_entry_fees })

          expect(registration.paid_entry_fees).to eq 0
          expect(payment_intent.confirmed_at).to be_nil
          expect(payment_intent.payment_record.reload.stripe_status).to eq('requires_payment_method')
          expect(payment_intent.payment_record.error).to eq('card_declined')
        end

        it "rejects payment despite successful 3DSecure" do
          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first

          expect do
            # mimic the user clicking through the interface
            payment_intent.payment_record.confirm_remote_for_test("pm_card_authenticationRequiredChargeDeclinedInsufficientFunds")

            # mimick the response that Stripe sends to our return_url after completing the checkout UI
            get registration_payment_completion_path(competition.id, :stripe), params: {
              payment_intent: payment_intent.payment_record.stripe_id,
              payment_intent_client_secret: payment_intent.client_secret,
            }
          end.not_to(change { registration.reload.outstanding_entry_fees })

          expect(registration.paid_entry_fees).to eq 0
          expect(payment_intent.confirmed_at).to be_nil
          expect(payment_intent.payment_record.reload.stripe_status).to eq('requires_action')
          expect(payment_intent.payment_record.error).to be_nil
        end

        it "records a failure in the stripe journal" do
          expect(StripeRecord.count).to eq 0
          expect(PaymentIntent.count).to eq 0

          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first
          expect(payment_intent).not_to be_nil

          # Intent should not be confirmed at this stage, because we have never received a receipt charge from Stripe yet
          expect(payment_intent.confirmed_at).to be_nil

          expect do
            # mimic the user clicking through the interface
            payment_intent.payment_record.confirm_remote_for_test("pm_card_visa_chargeDeclined")
          end.to raise_error(Stripe::StripeError, "Your card was declined.")

          # mimick the response that Stripe sends to our return_url after completing the checkout UI
          get registration_payment_completion_path(competition.id, :stripe), params: {
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }

          stripe_record = payment_intent.reload.payment_record
          # Now we should still wait for the confirmation because the card has been declined
          expect(payment_intent.confirmed_at).to be_nil
          expect(stripe_record).not_to be_nil
          expect(stripe_record.stripe_status).to eq "requires_payment_method"
          expect(stripe_record.error).not_to be_nil
          metadata = stripe_record.parameters["metadata"]
          expect(metadata["competition"]).to eq competition.id
        end

        it "recycles a PI when the previous payment was unsuccessful" do
          expect(StripeRecord.count).to eq 0
          expect(PaymentIntent.count).to eq 0

          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first
          expect(payment_intent).not_to be_nil

          # Intent should not be confirmed at this stage, because we have never received a receipt charge from Stripe yet
          expect(payment_intent.confirmed_at).to be_nil

          first_pi_stripe_id = payment_intent.payment_record.stripe_id
          first_pi_parameters = payment_intent.payment_record.parameters

          expect do
            # mimic the user clicking through the interface
            payment_intent.payment_record.confirm_remote_for_test("pm_card_visa_chargeDeclined")
          end.to raise_error(Stripe::StripeError, "Your card was declined.")

          # mimick the response that Stripe sends to our return_url after completing the checkout UI
          get registration_payment_completion_path(competition.id, :stripe), params: {
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }

          # Try to pay again. The old PI should be fetched as "not pending", so we expect that no new PI is being created
          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          new_payment_intents = registration.reload.payment_intents
          expect(new_payment_intents.size).to eq(1)

          # This _should_ be the same intent as the one we previously sent. Check that it really is.
          recycled_intent = new_payment_intents.first

          expect(recycled_intent.payment_record.stripe_id).to eq(first_pi_stripe_id)
          expect(recycled_intent.payment_record.parameters).to eq(first_pi_parameters)
        end

        it "recycles a PI even when the amount was updated" do
          expect(StripeRecord.count).to eq 0
          expect(PaymentIntent.count).to eq 0

          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first
          expect(payment_intent).not_to be_nil

          # Intent should not be confirmed at this stage, because we have never received a receipt charge from Stripe yet
          expect(payment_intent.confirmed_at).to be_nil

          first_pi_stripe_id = payment_intent.payment_record.stripe_id
          first_pi_parameters = payment_intent.payment_record.parameters

          expect do
            # mimic the user clicking through the interface
            payment_intent.payment_record.confirm_remote_for_test("pm_card_visa_chargeDeclined")
          end.to raise_error(Stripe::StripeError, "Your card was declined.")

          # mimick the response that Stripe sends to our return_url after completing the checkout UI
          get registration_payment_completion_path(competition.id, :stripe), params: {
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }

          # Try to pay again. The old PI should be fetched as "not pending", so we expect that no new PI is being created
          post registration_payment_intent_path(registration.id, :stripe), params: {
            # Pay some non-zero additional amount / donations.
            amount: registration.outstanding_entry_fees.cents * 2,
          }

          new_payment_intents = registration.reload.payment_intents
          expect(new_payment_intents.size).to eq(1)

          # This _should_ be the same intent as the one we previously sent. Check that it really is.
          recycled_intent = new_payment_intents.first

          expect(recycled_intent.payment_record.stripe_id).to eq(first_pi_stripe_id)
          # The amount is supposed to have changed!
          expect(recycled_intent.payment_record.parameters).not_to eq(first_pi_parameters)
        end

        it "does NOT recycle a PI when the payment is successful" do
          expect(StripeRecord.count).to eq 0
          expect(PaymentIntent.count).to eq 0

          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          payment_intent = registration.reload.payment_intents.first
          expect(payment_intent).not_to be_nil
          # Intent should not be confirmed at this stage, because we have never received a receipt charge from Stripe yet
          expect(payment_intent.confirmed_at).to be_nil

          first_pi_stripe_id = payment_intent.payment_record.stripe_id
          first_pi_parameters = payment_intent.payment_record.parameters

          # mimic the user clicking through the interface
          payment_intent.payment_record.confirm_remote_for_test("pm_card_visa")

          # mimick the response that Stripe sends to our return_url after completing the checkout UI
          get registration_payment_completion_path(competition.id, :stripe), params: {
            payment_intent: payment_intent.payment_record.stripe_id,
            payment_intent_client_secret: payment_intent.client_secret,
          }

          expect(registration.registration_payments.size).to eq(1)

          # The entry fee changed. Simulate a valid reason for the user having to pay again.
          competition.update!(base_entry_fee_lowest_denomination: 2000)

          # Try to pay again. The old PI should be fetched as "completed", so we expect that a new PI is being created
          post registration_payment_intent_path(registration.id, :stripe), params: {
            amount: registration.outstanding_entry_fees.cents,
          }

          new_payment_intents = registration.reload.payment_intents
          expect(new_payment_intents.size).to eq(2)

          # This should _not_ be the same intent as the one we previously sent.
          recycled_intent = new_payment_intents.last

          expect(recycled_intent.payment_record.stripe_id).not_to eq(first_pi_stripe_id)
          # The parameters should be the same, because
          #   (a) we're working on the same registration, so metadata is equal
          #   (b) the amount has doubled, so we're paying the same amount again that we already paid before
          expect(recycled_intent.payment_record.parameters).to eq(first_pi_parameters)
        end
      end
    end
  end

  describe "POST #create_paypal_order" do
    let(:competition) { create(:competition, :paypal_connected, :visible, :registration_open, events: Event.where(id: %w[222 333]), base_entry_fee_lowest_denomination: 1000) }
    let!(:user) { create(:user, :wca_id) }
    let!(:registration) { create(:registration, competition: competition, user: user) }

    before :each do
      sign_in user # TODO: Why do we need to sign in here?

      stubbed_order = create_order_payload(
        PaypalRecord.amount_to_paypal(competition.base_entry_fee_lowest_denomination, competition.currency_code),
        competition.currency_code,
      )

      order_url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/checkout/orders"
      stub_request(:post, order_url)
        .to_return(status: 200, body: stubbed_order, headers: { 'Content-Type' => 'application/json' })

      payload = { amount: competition.base_entry_fee_lowest_denomination }
      post registration_payment_intent_path(registration, :paypal), params: payload
    end

    it 'creates a PaypalRecord' do
      expect(PaypalRecord.count).to eq(1)
    end

    it 'PaypalRecord amount matches registration cost' do
      expect(PaypalRecord.first.money_amount).to eq(registration.competition.base_entry_fee)
    end
  end

  describe "POST #capture_paypal_payment" do
    let(:competition) { create(:competition, :paypal_connected, :visible, :registration_open, events: Event.where(id: %w[222 333]), base_entry_fee_lowest_denomination: 1000) }
    let!(:user) { create(:user, :wca_id) }
    let!(:registration) { create(:registration, competition: competition, user: user) }

    before :each do
      sign_in user

      stubbed_order = create_order_payload(
        PaypalRecord.amount_to_paypal(competition.base_entry_fee_lowest_denomination, competition.currency_code),
        competition.currency_code,
      )

      create_order_url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/checkout/orders"
      stub_request(:post, create_order_url)
        .to_return(status: 200, body: stubbed_order, headers: { 'Content-Type' => 'application/json' })

      # Create a PaypalOrder
      payload = { amount: competition.base_entry_fee_lowest_denomination }
      post registration_payment_intent_path(registration, :paypal), params: payload

      # Stub the create order response
      @record_id = JSON.parse(stubbed_order)['id']
      @currency_code = competition.currency_code
      @amount = PaypalRecord.amount_to_paypal(competition.base_entry_fee_lowest_denomination, @currency_code)

      url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/checkout/orders/#{@record_id}/capture"
      stub_request(:post, url)
        .to_return(status: 200, body: capture_order_response(@record_id, @amount, @currency_code), headers: { 'Content-Type' => 'application/json' })

      # Make the API call to capture the order
      post registration_capture_paypal_payment_path(registration.id), params: { orderID: @record_id }, as: :json
    end

    it 'creates a PaypalRecord of type :capture' do
      capture_id = response.parsed_body['purchase_units'][0]['payments']['captures'][0]['id']
      expect(PaypalRecord.find_by(paypal_id: capture_id).paypal_record_type).to eq('capture')
    end

    it 'associates PaypalCapture to the PaypalRecord' do
      paypal_record = PaypalRecord.find_by(paypal_id: response.parsed_body['id'])
      expect(paypal_record.child_records.count).to eq(1)
    end

    it 'creates a RegistrationPayment object' do
      expect(registration.registration_payments.count).to eq(1)
    end

    it 'RegistrationPayment has an associated PaypalRecord' do
      expect(registration.registration_payments.first.receipt_type).to eq("PaypalRecord")
    end

    it 'registration fees reflect as paid on successful capture' do
      expect(registration.paid_entry_fees.cents).to eq(registration.competition.base_entry_fee_lowest_denomination)
    end
  end

  # TODO: Add cases for partial refunds
  describe "POST #issue_paypal_refund" do
    let(:competition) { create(:competition, :paypal_connected, :visible, :registration_open, events: Event.where(id: %w[222 333]), base_entry_fee_lowest_denomination: 1000) }
    let!(:user) { create(:user, :wca_id) }
    let!(:admin_user) { create(:admin) }
    let!(:registration) { create(:registration, competition: competition, user: user) }

    before :each do
      sign_in user

      stubbed_order = create_order_payload(
        PaypalRecord.amount_to_paypal(competition.base_entry_fee_lowest_denomination, competition.currency_code),
        competition.currency_code,
      )

      create_order_url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/checkout/orders"
      stub_request(:post, create_order_url)
        .to_return(status: 200, body: stubbed_order, headers: { 'Content-Type' => 'application/json' })

      # Create a PaypalOrder
      payload = { amount: competition.base_entry_fee_lowest_denomination }
      post registration_payment_intent_path(registration, :paypal), params: payload

      # Stub the create order response
      @record_id = JSON.parse(stubbed_order)['id']
      @currency_code = competition.currency_code
      @amount = PaypalRecord.amount_to_paypal(competition.base_entry_fee_lowest_denomination, @currency_code)

      stubbed_capture = capture_order_response(@record_id, @amount, @currency_code)

      capture_url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/checkout/orders/#{@record_id}/capture"
      stub_request(:post, capture_url)
        .to_return(status: 200, body: stubbed_capture, headers: { 'Content-Type' => 'application/json' })

      # Make the API call to capture the order
      post registration_capture_paypal_payment_path(registration.id), params: { orderID: @record_id }, as: :json

      # Mock the refunds endpoint
      capture_id = JSON.parse(stubbed_capture)['purchase_units'][0]['payments']['captures'][0]['id']

      stubbed_refund = refund_response(capture_id, @amount, @currency_code)

      refund_url = "#{EnvConfig.PAYPAL_BASE_URL}/v2/payments/captures/#{capture_id}/refund"
      stub_request(:post, refund_url)
        .to_return(status: 200, body: stubbed_refund, headers: { 'Content-Type' => 'application/json' })

      # Make sure that we actually have permission to refund
      sign_in admin_user

      # Make the API call to issue the refund
      registration_payment = registration.registration_payments.first
      refund_params = { payment: { refund_amount: registration_payment.amount_lowest_denomination } }
      post registration_payment_refund_path(competition, 'paypal', registration_payment.receipt), params: refund_params

      # make sure every follow-up test gets a hold of the refunds
      registration.reload
    end

    it 'creates a RegistrationPayment with a negative value' do
      expect(registration.registration_payments[1].amount_lowest_denomination).to be < 0
    end

    it 'creates a PaypalRecord of type `refund`' do
      expect(registration.registration_payments[1].receipt.paypal_record_type).to eq('refund')
    end

    it 'records the registration total paid as zero' do
      expect(registration.paid_entry_fees.cents).to eq(0)
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

def expect_error_to_be(response, message)
  as_json = JSON.parse(response.body)
  expect(as_json["error"]["message"]).to eq message
end

def capture_order_response(record_id, amount, currency)
  {
    "id" => record_id,
    "status" => "COMPLETED",
    "payment_source" => {
      "paypal" => {
        "email_address" => "sb-f843db29377618@personal.example.com",
        "account_id" => "ZL2MQFQK9Z82Q",
        "account_status" => "VERIFIED",
        "name" => {
          "given_name" => "TestUser",
          "surname" => "One",
        },
        "address" => {
          "country_code" => "US",
        },
      },
    },
    "purchase_units" => [
      {
        "reference_id" => "default",
        "shipping" => {
          "name" => {
            "full_name" => "TestUser One",
          },
          "address" => {
            "address_line_1" => "1 Main St",
            "admin_area_2" => "San Jose",
            "admin_area_1" => "CA",
            "postal_code" => "95131",
            "country_code" => "US",
          },
        },
        "payments" => {
          "captures" => [
            {
              "id" => "7WA034444N6390300",
              "status" => "COMPLETED",
              "amount" => {
                "currency_code" => currency,
                "value" => amount,
              },
              "final_capture" => true,
              "disbursement_mode" => "INSTANT",
              "seller_protection" => {
                "status" => "ELIGIBLE",
                "dispute_categories" => %w[
                  ITEM_NOT_RECEIVED
                  UNAUTHORIZED_TRANSACTION
                ],
              },
              "links" => [
                {
                  "href" => "https://api.sandbox.paypal.com/v2/payments/captures/7WA034444N6390300",
                  "rel" => "self",
                  "method" => "GET",
                },
                {
                  "href" => "https://api.sandbox.paypal.com/v2/payments/captures/7WA034444N6390300/refund",
                  "rel" => "refund",
                  "method" => "POST",
                },
                {
                  "href" => "https://api.sandbox.paypal.com/v2/checkout/orders/3R2327881A3748640",
                  "rel" => "up",
                  "method" => "GET",
                },
              ],
              "create_time" => "2024-02-26T14:13:47Z",
              "update_time" => "2024-02-26T14:13:47Z",
            },
          ],
        },
      },
    ],
    "payer" => {
      "name" => {
        "given_name" => "TestUser",
        "surname" => "One",
      },
      "email_address" => "sb-f843db29377618@personal.example.com",
      "payer_id" => "ZL2MQFQK9Z82Q",
      "address" => {
        "country_code" => "US",
      },
    },
    "links" => [
      {
        "href" => "https://api.sandbox.paypal.com/v2/checkout/orders/3R2327881A3748640",
        "rel" => "self",
        "method" => "GET",
      },
    ],
  }.to_json
end

def create_order_payload(amount_paypal, currency_code)
  {
    id: "3R2327881A3748640",
    intent: "CAPTURE",
    status: "CREATED",
    purchase_units: [
      {
        reference_id: "default",
        amount: {
          currency_code: currency_code.upcase,
          value: amount_paypal,
        },
        payee: {
          email_address: "sb-noyt529176316@business.example.com",
          merchant_id: "HYJH9T9XSAKPN",
        },
      },
    ],
    create_time: DateTime.now.utc.iso8601,
    links: [
      {
        href: "https://api.sandbox.paypal.com/v2/checkout/orders/3R2327881A3748640",
        rel: "self",
        method: "GET",
      },
      {
        href: "https://www.sandbox.paypal.com/checkoutnow?token=3R2327881A3748640",
        rel: "approve",
        method: "GET",
      },
      {
        href: "https://api.sandbox.paypal.com/v2/checkout/orders/3R2327881A3748640",
        rel: "update",
        method: "PATCH",
      },
      {
        href: "https://api.sandbox.paypal.com/v2/checkout/orders/3R2327881A3748640/capture",
        rel: "capture",
        method: "POST",
      },
    ],
  }.to_json
end

def refund_response(capture_id, amount_paypal, currency_code)
  {
    id: "942276552E022623T",
    amount: {
      currency_code: currency_code,
      value: amount_paypal,
    },
    seller_payable_breakdown: {
      gross_amount: {
        currency_code: currency_code,
        value: amount_paypal,
      },
      paypal_fee: {
        currency_code: currency_code,
        value: PaypalRecord.amount_to_paypal(0, currency_code),
      },
      net_amount: {
        currency_code: currency_code,
        value: amount_paypal,
      },
      total_refunded_amount: {
        currency_code: currency_code,
        value: amount_paypal,
      },
    },
    status: "COMPLETED",
    create_time: DateTime.now.utc.iso8601,
    update_time: DateTime.now.utc.iso8601,
    links: [
      { href: "https://api.sandbox.paypal.com/v2/payments/refunds/942276552E022623T", rel: "self", method: "GET" },
      { href: "https://api.sandbox.paypal.com/v2/payments/captures/#{capture_id}", rel: "up", method: "GET" },
    ],
  }.to_json
end

def payment_confirmation_webhook_as_json(intent, account_id)
  {
    id: "evt_3P6aXQJzvpX2joEA18jzmlxq",
    object: "event",
    account: account_id,
    api_version: "2023-10-16",
    created: DateTime.now.to_i,
    data: { object: intent },
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: "req_PgTt3KXlGjI0vd",
      idempotency_key: "400ffbac-cfe0-476e-ad40-335b329bb0e8",
    },
    type: "payment_intent.succeeded",
  }.to_json
end
