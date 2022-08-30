# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.describe "registrations" do
  let!(:competition) { FactoryBot.create(:competition, :with_delegate, :visible, event_ids: %w(333 444)) }

  describe "POST #do_import" do
    context "when signed in as a normal user" do
      it "doesn't allow access" do
        sign_in FactoryBot.create(:user)
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

      it "renders an error when there are missing columns" do
        file = csv_file [
          ["Status", "Name", "WCA ID", "Birth date", "Gender", "Email", "444"],
        ]
        post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
        follow_redirect!
        expect(response.body).to include "Missing columns: country, 333."
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

      it "renders an error when there are active registrations for other Series competitions" do
        two_timer_dave = FactoryBot.create(:user, :wca_id)

        series = FactoryBot.create(:competition_series)
        competition.update!(competition_series: series)

        partner_competition = FactoryBot.create(:competition, :with_delegate, :visible, event_ids: %w(333 555),
                                                                                        competition_series: series, series_base: competition)

        # make sure there is a dummy registration for the partner competition.
        FactoryBot.create(:registration, :accepted, competition: partner_competition, user: two_timer_dave)

        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ["a", two_timer_dave.name, two_timer_dave.country.id, two_timer_dave.wca_id, two_timer_dave.dob, two_timer_dave.gender, two_timer_dave.email, "1", "1"],
        ]
        expect {
          post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
        }.to_not change { competition.registrations.count }
        follow_redirect!
        expect(response.body).to include "Error importing #{two_timer_dave.name}: Validation failed: Competition You can only be accepted for one Series competition at a time."
      end

      it "renders an error when there are email duplicates" do
        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ["a", "Sherlock Holmes", "United Kingdom", "", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
          ["a", "John Watson", "United Kingdom", "", "2000-01-01", "m", "sherlock@example.com", "1", "1"],
        ]
        expect {
          post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
        }.to_not change { competition.registrations.count }
        follow_redirect!
        expect(response.body).to include "Email must be unique, found the following duplicates: sherlock@example.com."
      end

      it "renders an error when there are WCA ID duplicates" do
        file = csv_file [
          ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
          ["a", "Sherlock Holmes", "United Kingdom", "2019HOLM01", "2000-01-01", "m", "sherlock@example.com", "1", "0"],
          ["a", "John Watson", "United Kingdom", "2019HOLM01", "2000-01-01", "m", "watson@example.com", "1", "1"],
        ]
        expect {
          post competition_registrations_do_import_path(competition), params: { registrations_import: { registrations_file: file } }
        }.to_not change { competition.registrations.count }
        follow_redirect!
        expect(response.body).to include "WCA ID must be unique, found the following duplicates: 2019HOLM01."
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
            expect(response.body).to match(/The WCA ID 1000DARN99 doesn.*t exist/)
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
                      ["a", dummy_user.name, dummy_user.country.id, dummy_user.wca_id, dummy_user.dob, dummy_user.gender, user.email, "1", "0"],
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
                      ["a", dummy_user.name, dummy_user.country.id, dummy_user.wca_id, dummy_user.dob, dummy_user.gender, user.email, "1", "0"],
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
                    ["a", dummy_user.name, dummy_user.country.id, dummy_user.wca_id, dummy_user.dob, dummy_user.gender, "sherlock@example.com", "1", "0"],
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
                  ["a", user.name, user.country.id, user.wca_id, user.dob, user.gender, "sherlock@example.com", "1", "0"],
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
                    ["a", person.name, person.country.id, person.wca_id, person.dob, person.gender, user.email, "1", "0"],
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
                  user = FactoryBot.create(
                    :user,
                    unconfirmed_wca_id: person.wca_id,
                    dob_verification: person.dob,
                    delegate_to_handle_wca_id_claim: User.delegates.first,
                  )
                  file = csv_file [
                    ["Status", "Name", "Country", "WCA ID", "Birth date", "Gender", "Email", "333", "444"],
                    ["a", person.name, person.country.id, person.wca_id, person.dob, person.gender, user.email, "1", "0"],
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
                    ["a", person.name, person.country.id, person.wca_id, person.dob, person.gender, user.email, "1", "0"],
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
                  ["a", person.name, person.country.id, person.wca_id, person.dob, person.gender, "sherlock@example.com", "1", "0"],
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
              ["a", user.name, user.country.id, "", user.dob, user.gender, user.email, "1", "0"],
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
              ["a", user.name, user.country.id, "", user.dob, user.gender, user.email, "1", "1"],
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
              ["a", user.name, user.country.id, "", user.dob, user.gender, user.email, "1", "0"],
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
          it "creates a new registration" do
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

  # Adding a registration reuses the logic behind importing CSV registrations
  # and that's tested thoroughly above.
  describe "POST #do_add" do
    context "when signed in as a normal user" do
      it "doesn't allow access" do
        sign_in FactoryBot.create(:user)
        post competition_registrations_do_import_path(competition)
        expect(response).to redirect_to root_url
      end
    end

    context "when signed in as competition manager" do
      before do
        sign_in competition.delegates.first
      end

      context "when there is existing registration for the given person" do
        it "renders an error" do
          registration = FactoryBot.create(:registration, :accepted, competition: competition, events: %w(333))
          user = registration.user
          expect {
            post competition_registrations_do_add_path(competition), params: {
              registration_data: {
                name: user.name, country: user.country.id, birth_date: user.dob,
                gender: user.gender, email: user.email, event_ids: ["444"]
              },
            }
          }.to not_change { competition.registrations.count }
          expect(response.body).to include "This person already has a registration."
        end
      end

      context "when there is another registration in the same series" do
        it "renders an error" do
          two_timer_dave = FactoryBot.create(:user)

          series = FactoryBot.create(:competition_series)
          competition.update!(competition_series: series)

          partner_competition = FactoryBot.create(:competition, :with_delegate, :visible, event_ids: %w(333 555),
                                                                                          competition_series: series, series_base: competition)

          # make sure there is a dummy registration for the partner competition.
          FactoryBot.create(:registration, :accepted, competition: partner_competition, user: two_timer_dave)

          expect {
            post competition_registrations_do_add_path(competition), params: {
              registration_data: {
                name: two_timer_dave.name, country: two_timer_dave.country.id, birth_date: two_timer_dave.dob,
                gender: two_timer_dave.gender, email: two_timer_dave.email, event_ids: ["444"]
              },
            }
          }.to_not change { competition.registrations.count }
          expect(response.body).to include "You can only be accepted for one Series competition at a time"
        end
      end

      context "when there is no existing registration for the given person" do
        it "creates an accepted registration" do
          expect {
            post competition_registrations_do_add_path(competition), params: {
              registration_data: {
                name: "Sherlock Holmes", country: "United Kingdom", birth_date: "2000-01-01",
                gender: "m", email: "sherlock@example.com", event_ids: ["444"]
              },
            }
          }.to change { competition.registrations.count }.by(1)
          registration = competition.registrations.last
          expect(registration.user.name).to eq "Sherlock Holmes"
          expect(registration.events.map(&:id)).to eq ["444"]
          expect(registration).to be_accepted
          follow_redirect!
          expect(response.body).to include "Successfully added registration!"
        end
      end

      context "when competitor limit has been reached" do
        it "redirects to competition page" do
          FactoryBot.create(:registration, :accepted, competition: competition, events: %w(333))
          competition.update!(
            competitor_limit_enabled: true, competitor_limit: 1, competitor_limit_reason: "So I take all the podiums",
          )
          expect {
            post competition_registrations_do_add_path(competition), params: {
              registration_data: {
                name: "Sherlock Holmes", country: "United Kingdom", birth_date: "2000-01-01",
                gender: "m", email: "sherlock@example.com", event_ids: ["444"]
              },
            }
          }.to_not change { competition.registrations.count }
          follow_redirect!
          expect(response.body).to include "The competitor limit has been reached"
        end
      end
    end
  end

  describe "POST #process_payment_intent" do
    context "when not signed in" do
      let(:competition) { FactoryBot.create(:competition, :stripe_connected, :visible, :registration_open, events: Event.where(id: %w(222 333))) }
      let!(:user) { FactoryBot.create(:user, :wca_id) }
      let!(:registration) { FactoryBot.create(:registration, competition: competition, user: user) }
      sign_out

      it "redirects to the sign in page" do
        post registration_payment_intent_path(registration)
        expect(response).to redirect_to new_user_session_path
      end
    end

    context "when signed in" do
      let(:competition) { FactoryBot.create(:competition, :stripe_connected, :visible, :registration_open, events: Event.where(id: %w(222 333)), base_entry_fee_lowest_denomination: 1000) }
      let!(:user) { FactoryBot.create(:user, :wca_id) }
      let!(:registration) { FactoryBot.create(:registration, competition: competition, user: user) }

      before :each do
        sign_in user
      end

      it "restricts access to the registration's owner" do
        user2 = FactoryBot.create(:user, :wca_id)
        registration2 = FactoryBot.create(:registration, competition: competition, user: user2)
        post registration_payment_intent_path(registration2.id)
        expect(response.status).to eq 403
      end

      context "with a valid credit card without SCA" do
        let!(:card) { FactoryBot.create(:credit_card) }
        let!(:pm) {
          # This emulates the client side action from the user: when submitting a payment
          # Stripe creates a payment method and POST its id to us.
          Stripe::PaymentMethod.create(
            { type: "card", card: card },
            stripe_account: competition.connected_stripe_account_id,
          )
        }

        it "rejects insufficient payment with valid credit card" do
          payment_amount = registration.outstanding_entry_fees / 2
          expect {
            post registration_payment_intent_path(registration.id), params: {
              payment_method_id: pm.id,
              amount: payment_amount,
            }
          }.to_not change { registration.reload.outstanding_entry_fees }
          expect_error_to_be(response, I18n.t("registrations.payment_form.alerts.amount_too_low"))
        end

        it "processes payment with a valid credit card without SCA" do
          expect(registration.outstanding_entry_fees).to eq competition.base_entry_fee
          post registration_payment_intent_path(registration.id), params: {
            payment_method_id: pm.id,
            amount: registration.outstanding_entry_fees.cents,
          }
          # NOTE: the #process_payment_intent endpoint doesn't redirect, it's
          # the 'register' page which does.
          expect(registration.reload.outstanding_entry_fees).to eq 0
          expect(registration.paid_entry_fees).to eq competition.base_entry_fee
          charge = Stripe::Charge.retrieve(registration.registration_payments.first.stripe_charge_id, stripe_account: competition.connected_stripe_account_id)
          expect(charge.amount).to eq competition.base_entry_fee.cents
          expect(charge.receipt_email).to eq user.email
          expect(charge.metadata.competition).to eq competition.name
          expect(charge.metadata.registration_url).to eq edit_registration_url(registration)
          # Check that the website actually records who made the charge
          expect(registration.registration_payments.first.user).to eq user
        end

        it "processes payment with donation and valid credit card without SCA" do
          donation_lowest_denomination = 100
          payment_amount = registration.outstanding_entry_fees.cents + donation_lowest_denomination
          post registration_payment_intent_path(registration.id), params: {
            payment_method_id: pm.id,
            amount: payment_amount,
          }
          expect(registration.reload.outstanding_entry_fees.cents).to eq(-donation_lowest_denomination)
          expect(registration.paid_entry_fees.cents).to eq payment_amount
          charge = Stripe::Charge.retrieve(registration.registration_payments.first.stripe_charge_id, stripe_account: competition.connected_stripe_account_id)
          expect(charge.amount).to eq payment_amount
        end

        it "insert a success in the stripe journal" do
          expect(StripeCharge.all.length).to eq 0
          post registration_payment_intent_path(registration.id), params: {
            payment_method_id: pm.id,
            amount: registration.outstanding_entry_fees.cents,
          }
          stripe_charge_id = registration.reload.registration_payments.first.stripe_charge_id
          stripe_charge = StripeCharge.find_by(stripe_charge_id: stripe_charge_id)
          expect(stripe_charge&.status).to eq "success"
          metadata = JSON.parse(stripe_charge.metadata)["metadata"]
          expect(metadata["competition"]).to eq competition.name
        end
      end

      context "with a valid 3D-secure credit card" do
        let!(:card) { FactoryBot.create(:credit_card, :sca_card) }
        let!(:pm) {
          # This emulates the client side action from the user: when submitting a payment
          # Stripe creates a payment method and POST its id to us.
          Stripe::PaymentMethod.create(
            { type: "card", card: card },
            stripe_account: competition.connected_stripe_account_id,
          )
        }

        it "asks for further action before recording payment" do
          # The #process_payment_intent endpoint doesn't redirect, it's
          # the 'register' page which does.
          expect {
            post registration_payment_intent_path(registration.id), params: {
              payment_method_id: pm.id,
              amount: registration.outstanding_entry_fees.cents,
            }
          }.to_not change { registration.reload.outstanding_entry_fees }
          expect(registration.paid_entry_fees).to eq 0
          response_json = JSON.parse(response.body)
          expect(response_json["requires_action"]).to be true
          # That's as far as we can go, testing the authentication success/failure
          # must be done by clicking on a modal.
        end

        it "inserts an 'intent registered' event in the stripe journal" do
          expect(StripeCharge.all.length).to eq 0
          post registration_payment_intent_path(registration.id), params: {
            payment_method_id: pm.id,
            amount: registration.outstanding_entry_fees.cents,
          }
          stripe_charge = StripeCharge.first
          expect(stripe_charge&.status).to eq "payment_intent_registered"
          metadata = JSON.parse(stripe_charge.metadata)
          expect(metadata["payment_method"]).to eq pm.id
          expect(metadata["metadata"]["competition"]).to eq competition.name
        end
      end

      # The tests below are to test that our endpoint correctly forwards errors,
      # not to actually test Stripe's correctness...
      context "rejected credit cards" do
        it "rejects payment with declined credit card" do
          card = FactoryBot.create(:credit_card, :invalid)
          pm = Stripe::PaymentMethod.create(
            { type: "card", card: card },
            stripe_account: competition.connected_stripe_account_id,
          )
          expect {
            post registration_payment_intent_path(registration.id), params: {
              payment_method_id: pm.id,
              amount: registration.outstanding_entry_fees.cents,
            }
          }.to_not change { registration.reload.outstanding_entry_fees }
          expect_error_to_be(response, "Your card was declined.")
        end

        it "rejects payment with expired credit card" do
          card = FactoryBot.create(:credit_card, :expired)
          pm = Stripe::PaymentMethod.create(
            { type: "card", card: card },
            stripe_account: competition.connected_stripe_account_id,
          )
          post registration_payment_intent_path(registration.id), params: {
            payment_method_id: pm.id,
            amount: registration.outstanding_entry_fees.cents,
          }
          expect_error_to_be(response, "Your card has expired.")
        end

        it "rejects payment with incorrect cvc" do
          card = FactoryBot.create(:credit_card, :incorrect_cvc)
          pm = Stripe::PaymentMethod.create(
            { type: "card", card: card },
            stripe_account: competition.connected_stripe_account_id,
          )
          post registration_payment_intent_path(registration.id), params: {
            payment_method_id: pm.id,
            amount: registration.outstanding_entry_fees.cents,
          }
          expect_error_to_be(response, "Your card's security code is incorrect.")
        end

        it "records a failure in the stripe journal" do
          expect(StripeCharge.all.length).to eq 0
          card = FactoryBot.create(:credit_card, :invalid)
          pm = Stripe::PaymentMethod.create(
            { type: "card", card: card },
            stripe_account: competition.connected_stripe_account_id,
          )
          post registration_payment_intent_path(registration.id), params: {
            payment_method_id: pm.id,
            amount: registration.outstanding_entry_fees.cents,
          }
          stripe_charge = StripeCharge.first
          expect(stripe_charge&.status).to eq "failure"
          metadata = JSON.parse(stripe_charge.metadata)
          expect(metadata["payment_method"]).to eq pm.id
          expect(metadata["metadata"]["competition"]).to eq competition.name
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

def expect_error_to_be(response, message)
  as_json = JSON.parse(response.body)
  expect(as_json["error"]["message"]).to eq message
end
