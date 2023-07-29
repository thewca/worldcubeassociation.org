# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
  let(:dob_form_path) { Rails.application.routes.url_helpers.contact_dob_path }
  let(:africa_region) { FactoryBot.create :africa_region }

  it "defines a valid user" do
    user = FactoryBot.create :user
    expect(user).to be_valid
  end

  it "defines a dummy user" do
    user = FactoryBot.create :dummy_user
    expect(user).to be_valid
    expect(user.dummy_account?).to be true
    users = User.search("")
    expect(users.count).to eq 0
  end

  it "search can find people who never logged in, but aren't dummy accounts" do
    user = FactoryBot.create :user, encrypted_password: ""
    expect(user.dummy_account?).to be false
    users = User.search("")
    expect(users.count).to eq 1
    expect(users.first).to eq user
  end

  it "search returns only people with subId 1" do
    FactoryBot.create :person, wca_id: "2005FLEI01", subId: 1
    FactoryBot.create :person, wca_id: "2005FLEI01", subId: 2
    FactoryBot.create :user, wca_id: "2005FLEI01"

    users = User.search("2005FLEI01", params: { persons_table: true })
    expect(users.count).to eq 1
    expect(users[0].subId).to eq 1
  end

  it "allows empty country" do
    user = FactoryBot.build :user, country_iso2: ""
    expect(user).to be_valid

    user = FactoryBot.build :user, country_iso2: nil
    expect(user).to be_valid
  end

  it "allows valid fancy email" do
    user = FactoryBot.build(:user, email: "aa124_qs.totof+topic@gmail.com")
    expect(user).to be_valid
  end

  it "invalidates silly typos in email" do
    user = FactoryBot.build(:user, email: "aa@bbb,com")
    expect(user).to be_invalid_with_errors(email: ["is invalid"])

    user = FactoryBot.build(:user, email: "aabbb.com")
    expect(user).to be_invalid_with_errors(email: ["is invalid"])

    user = FactoryBot.build(:user, email: "john@gmail..com")
    expect(user).to be_invalid_with_errors(email: ["is invalid"])
  end

  it "can confirm a user who has never competed before" do
    user = FactoryBot.build :user, unconfirmed_wca_id: ""
    user.confirm
  end

  it "allows demotion of a senior delegate with no subordinate delegates" do
    senior_delegate = FactoryBot.create :senior_delegate

    senior_delegate.delegate_status = ""
    expect(senior_delegate.save).to eq true
    expect(senior_delegate.reload.delegate_status).to eq nil
  end

  it "requires senior delegate be a senior delegate" do
    delegate = FactoryBot.create :delegate
    user = FactoryBot.create :user

    delegate.senior_delegate = user
    expect(delegate).to be_invalid_with_errors(senior_delegate: ["must be a Senior Delegate"])

    user.senior_delegate!
    expect(delegate).to be_valid
  end

  it "requires senior delegate if delegate status allows it" do
    delegate = FactoryBot.build :delegate, senior_delegate: nil
    expect(delegate).to be_invalid_with_errors(senior_delegate: ["can't be blank"])
  end

  it "doesn't delete a real account when a dummy account's WCA ID is cleared" do
    # Create someone without a password and without a WCA ID. This simulates the kind
    # of accounts we originally created for all delegates without accounts.
    delegate = FactoryBot.create(:delegate, encrypted_password: "", wca_id: nil)

    dummy_user = FactoryBot.create :dummy_user
    dummy_user.wca_id = nil
    dummy_user.save!
    expect(User.find(delegate.id)).to eq delegate
  end

  it "does not give delegates results admin privileges" do
    delegate = FactoryBot.create :delegate
    expect(delegate.can_admin_results?).to be false
  end

  it "does not allow senior delegate if senior delegate" do
    senior_delegate1 = FactoryBot.create :user
    senior_delegate1.senior_delegate!

    senior_delegate2 = FactoryBot.create :user
    senior_delegate2.senior_delegate!

    expect(senior_delegate1).to be_valid
    senior_delegate1.senior_delegate = senior_delegate2
    expect(senior_delegate1).to be_invalid_with_errors(senior_delegate: ["must not be present"])
  end

  it "allows senior delegate if board member" do
    board_member = FactoryBot.create :delegate, :board_member

    senior_delegate = FactoryBot.create :user
    senior_delegate.senior_delegate!

    expect(board_member).to be_valid
    board_member.senior_delegate = senior_delegate
    expect(board_member).to be_valid
  end

  it "does not allow senior delegate if regular user" do
    user = FactoryBot.create :user

    senior_delegate = FactoryBot.create :user
    senior_delegate.senior_delegate!

    expect(user).to be_valid
    user.senior_delegate = senior_delegate
    expect(user).to be_invalid_with_errors(senior_delegate: ["must not be present"])
  end

  describe "WCA ID" do
    let(:user) { FactoryBot.create :user_with_wca_id }
    let(:birthdayless_person) { FactoryBot.create :person, :missing_dob, :skip_validation }
    let(:genderless_person) { FactoryBot.create :person, :missing_gender }

    it "validates WCA ID" do
      user = FactoryBot.build :user, wca_id: "2005FLEI02"
      expect(user).not_to be_valid

      user = FactoryBot.build :user, wca_id: "2005FLE01"
      expect(user).to be_invalid_with_errors(wca_id: ["is invalid", "not found"])

      user = FactoryBot.build :user, wca_id: "200FLEI01"
      expect(user).to be_invalid_with_errors(wca_id: ["is invalid", "not found"])

      user = FactoryBot.build :user, wca_id: "200FLEI0"
      expect(user).to be_invalid_with_errors(wca_id: ["is invalid", "not found"])
    end

    it "requires that name match person name" do
      user.name = "jfly"
      user.save!
      expect(user.name).to eq user.person.name
    end

    it "handles Person name changing" do
      expect(user.name).to eq user.person.name
      user.person.name = "New name"
      user.person.save!
      expect(user).to be_valid
    end

    it "does not allow assigning a birthdateless WCA ID to a user" do
      user.wca_id = birthdayless_person.wca_id
      expect(user).to be_invalid_with_errors(wca_id: [I18n.t('users.errors.wca_id_no_birthdate_html', dob_form_path: dob_form_path)])
    end

    it "does not allow assigning a genderless WCA ID to a user" do
      user.wca_id = genderless_person.wca_id
      expect(user).to be_invalid_with_errors(wca_id: [I18n.t('users.errors.wca_id_no_gender_html')])
    end

    it "nullifies empty WCA IDs" do
      # Verify that we can create multiple users with empty wca_ids
      user2 = FactoryBot.create :user, wca_id: ""
      expect(user2.wca_id).to be_nil

      user.wca_id = ""
      user.save!
      expect(user.wca_id).to be_nil
    end

    context "when WCA ID is not unique" do
      let(:existing_user) { FactoryBot.create :user_with_wca_id }
      let(:invalid_user) { FactoryBot.build :user, wca_id: existing_user.wca_id }

      it "verifies WCA ID unique when changing WCA ID" do
        expect(invalid_user.valid?).to be false
        expect(invalid_user.errors.messages).to include :wca_id
      end

      it "shows an appropriate error message" do
        expect(invalid_user).to be_invalid_with_errors(wca_id: [I18n.t('users.errors.unique_html',
                                                                       used_name: existing_user.name,
                                                                       used_email: existing_user.email,
                                                                       used_edit_path: Rails.application.routes.url_helpers.edit_user_path(existing_user))])
      end
    end

    it "removes dummy accounts and copies name when WCA ID is assigned" do
      dummy_user = FactoryBot.create :dummy_user
      person_for_dummy = dummy_user.person
      expect(dummy_user).to be_valid
      dummy_user.update!(
        avatar: File.open(Rails.root.join("spec/support/logo.jpg")),
        avatar_crop_x: 40,
        avatar_crop_y: 40,
        avatar_crop_w: 40,
        avatar_crop_h: 40,
      )
      avatar = dummy_user.reload.read_attribute(:avatar)
      expect(dummy_user.avatar.file.path).to eq("uploads/user/avatar/#{dummy_user.wca_id}/#{avatar}")

      # Assigning a WCA ID to user should copy over the name from the Persons table.
      expect(user.name).to eq user.person.name
      user.wca_id = dummy_user.wca_id
      user.save!
      expect(user.name).to eq person_for_dummy.name

      # Check that the dummy account was deleted, and we inherited its avatar.
      expect(User.find_by_id(dummy_user.id)).to be_nil
      expect(user.reload.read_attribute(:avatar)).to eq avatar
      expect(dummy_user.avatar.file.path).to eq("uploads/user/avatar/#{dummy_user.wca_id}/#{avatar}")
    end

    it "does not allow duplicate WCA IDs" do
      user2 = FactoryBot.create :user
      expect(user2).to be_valid
      user2.wca_id = user.wca_id
      expect(user2).not_to be_valid
    end

    it "does not allows assigning WCA ID if user and person details don't match" do
      user = FactoryBot.create(:user, name: "Whatever", country_iso2: "US", dob: Date.new(1950, 12, 12), gender: "m")
      person = FactoryBot.create(:person, name: "Else", countryId: "United Kingdom", dob: '1900-01-01', gender: "f")
      user.wca_id = person.wca_id
      expect(user).to be_invalid_with_errors(
        name: [I18n.t('users.errors.must_match_person')],
        country_iso2: [I18n.t('users.errors.must_match_person')],
        dob: [I18n.t('users.errors.must_match_person')],
        gender: [I18n.t('users.errors.must_match_person')],
      )
    end
  end

  it "can create user with empty password" do
    FactoryBot.create :user, encrypted_password: ""
  end

  it "saves crop coordinates" do
    user = FactoryBot.create :user_with_wca_id

    user.update!(
      pending_avatar: File.open(Rails.root.join("spec/support/logo.jpg")),
    )
    expect(user.read_attribute(:pending_avatar)).not_to be_nil

    user.update!(
      pending_avatar_crop_x: 40,
      pending_avatar_crop_y: 50,
      pending_avatar_crop_w: 60,
      pending_avatar_crop_h: 70,
    )
    expect(user.saved_pending_avatar_crop_x).to eq 40
    expect(user.saved_pending_avatar_crop_y).to eq 50
    expect(user.saved_pending_avatar_crop_w).to eq 60
    expect(user.saved_pending_avatar_crop_h).to eq 70
  end

  it "can handle missing avatar" do
    user = FactoryBot.create :user
    user.avatar = nil
    user.saved_avatar_crop_x = 40
    user.saved_avatar_crop_y = 40
    user.saved_avatar_crop_w = 40
    user.saved_avatar_crop_h = 40
    user.save!
  end

  it "clearing avatar clears cropping area" do
    user = FactoryBot.create :user_with_wca_id
    user.update!(
      avatar: File.open(Rails.root.join("spec/support/logo.jpg")),
      avatar_crop_x: 40,
      avatar_crop_y: 40,
      avatar_crop_w: 40,
      avatar_crop_h: 40,

      pending_avatar: File.open(Rails.root.join("spec/support/logo.jpg")),
      pending_avatar_crop_x: 40,
      pending_avatar_crop_y: 40,
      pending_avatar_crop_w: 40,
      pending_avatar_crop_h: 40,
    )
    # Get rid of cached carrierwave-crop stuff by relooking up user
    user = User.find(user.id)
    user.remove_avatar = true
    user.remove_pending_avatar = true
    user.save!
    expect(user.read_attribute(:avatar)).to be_nil
    expect(user.read_attribute(:pending_avatar)).to be_nil
    expect(user.saved_avatar_crop_x).to be_nil
    expect(user.saved_avatar_crop_y).to be_nil
    expect(user.saved_avatar_crop_w).to be_nil
    expect(user.saved_avatar_crop_h).to be_nil
    expect(user.saved_pending_avatar_crop_x).to be_nil
    expect(user.saved_pending_avatar_crop_y).to be_nil
    expect(user.saved_pending_avatar_crop_w).to be_nil
    expect(user.saved_pending_avatar_crop_h).to be_nil
  end

  it "approving pending avatar moves crop coordinates" do
    user = FactoryBot.create :user_with_wca_id
    user.update!(
      pending_avatar: File.open(Rails.root.join("spec/support/logo.jpg")),
      pending_avatar_crop_x: 40,
      pending_avatar_crop_y: 50,
      pending_avatar_crop_w: 60,
      pending_avatar_crop_h: 70,
    )
    user.approve_pending_avatar!
    expect(user.read_attribute(:avatar)).not_to be_nil
    expect(user.saved_avatar_crop_x).to eq 40
    expect(user.saved_avatar_crop_y).to eq 50
    expect(user.saved_avatar_crop_w).to eq 60
    expect(user.saved_avatar_crop_h).to eq 70

    expect(user.read_attribute(:pending_avatar)).to be_nil
    expect(user.saved_pending_avatar_crop_x).to eq nil
    expect(user.saved_pending_avatar_crop_y).to eq nil
    expect(user.saved_pending_avatar_crop_w).to eq nil
    expect(user.saved_pending_avatar_crop_h).to eq nil
  end

  describe "#delegated_competitions" do
    let(:delegate) { FactoryBot.create :delegate, region_id: africa_region.id }
    let(:other_delegate) { FactoryBot.create :delegate }
    let!(:confirmed_competition1) { FactoryBot.create :competition, delegates: [delegate] }
    let!(:confirmed_competition2) { FactoryBot.create :competition, delegates: [delegate] }
    let!(:unconfirmed_competition1) { FactoryBot.create :competition, delegates: [delegate] }
    let!(:unconfirmed_competition2) { FactoryBot.create :competition, delegates: [delegate] }
    let!(:other_delegate_unconfirmed_competition) { FactoryBot.create :competition, delegates: [other_delegate] }

    it "sees delegated competitions" do
      expect(delegate.delegated_competitions).to match_array [
        confirmed_competition1,
        confirmed_competition2,
        unconfirmed_competition1,
        unconfirmed_competition2,
      ]
    end
  end

  describe "#organized_competitions" do
    let(:user) { FactoryBot.create :user }
    let(:competition) { FactoryBot.create :competition, organizers: [user] }

    it "sees organized competitions" do
      expect(user.organized_competitions).to eq [competition]
    end
  end

  describe "check if registration form sends mail to newly registered user" do
    it "sends mail" do
      user = FactoryBot.build(:user, confirmed: false)
      expect(NewRegistrationMailer).to receive(:send_registration_mail).with(user).and_call_original
      user.save!
    end
  end

  describe "unconfirmed_wca_id" do
    let!(:person) { FactoryBot.create :person, dob: '1990-01-02' }
    let!(:senior_delegate) { FactoryBot.create :senior_delegate, region_id: africa_region.id }
    let!(:delegate) { FactoryBot.create :delegate, senior_delegate: senior_delegate, region_id: africa_region.id }
    let!(:user) do
      FactoryBot.create(:user, unconfirmed_wca_id: person.wca_id,
                               delegate_id_to_handle_wca_id_claim: delegate.id,
                               claiming_wca_id: true,
                               dob_verification: "1990-01-2")
    end

    let!(:person_without_dob) { FactoryBot.create :person, :skip_validation, dob: nil }
    let!(:person_without_gender) { FactoryBot.create :person, gender: nil }
    let!(:user_with_wca_id) { FactoryBot.create :user_with_wca_id }

    it "defines a valid user" do
      expect(user).to be_valid

      # The database object without the unpersisted fields like dob_verification should
      # also be valid.
      expect(User.find(user.id)).to be_valid
    end

    it "doesn't allow user to change unconfirmed_wca_id" do
      expect(user).to be_valid
      user.claiming_wca_id = false
      other_person = FactoryBot.create :person, dob: '1980-02-01'
      user.unconfirmed_wca_id = other_person.wca_id
      expect(user).to be_invalid_with_errors(dob_verification: [I18n.t("users.errors.dob_incorrect_html", dob_form_path: dob_form_path)])
    end

    it "requires fields when claiming_wca_id" do
      user.unconfirmed_wca_id = nil
      user.dob_verification = nil
      user.delegate_id_to_handle_wca_id_claim = nil
      expect(user).to be_invalid_with_errors(
        unconfirmed_wca_id: ['required'],
        delegate_id_to_handle_wca_id_claim: ['required'],
      )
    end

    it "requires unconfirmed_wca_id" do
      user.unconfirmed_wca_id = ""
      expect(user).to be_invalid_with_errors(unconfirmed_wca_id: ['is invalid', 'required'])
    end

    it "requires dob verification" do
      user.dob_verification = nil
      expect(user).to be_invalid_with_errors(dob_verification: [I18n.t("users.errors.dob_incorrect_html", dob_form_path: dob_form_path)])
    end

    it "does not allow claiming wca id Person without dob" do
      user.unconfirmed_wca_id = person_without_dob.wca_id
      user.dob_verification = "1234-04-03"
      expect(user).to be_invalid_with_errors(dob_verification: [I18n.t('users.errors.wca_id_no_birthdate_html', dob_form_path: dob_form_path)])
    end

    it "does not allow claiming wca id Person without gender" do
      user.unconfirmed_wca_id = person_without_gender.wca_id
      user.dob_verification = "1234-04-03"
      expect(user).to be_invalid_with_errors(gender: [I18n.t('users.errors.wca_id_no_gender_html')])
    end

    it "does not show a message about incorrect dob for people who have already claimed their wca id" do
      user.unconfirmed_wca_id = user_with_wca_id.wca_id
      expect(user).to be_invalid_with_errors(
        unconfirmed_wca_id: ["already assigned to a different user"],
        dob_verification: [],
      )
    end

    it "requires correct dob verification" do
      user.dob_verification = '2016-01-02'
      expect(user).to be_invalid_with_errors(dob_verification: [I18n.t("users.errors.dob_incorrect_html", dob_form_path: dob_form_path)])
    end

    it "requires delegate_id_to_handle_wca_id_claim" do
      user.delegate_id_to_handle_wca_id_claim = nil
      expect(user).to be_invalid_with_errors(delegate_id_to_handle_wca_id_claim: ['required'])
    end

    it "delegate_id_to_handle_wca_id_claim must be a delegate" do
      user.delegate_id_to_handle_wca_id_claim = user.id
      expect(user).to be_invalid_with_errors(delegate_id_to_handle_wca_id_claim: ["not found"])
    end

    it "must claim a real wca id" do
      user.unconfirmed_wca_id = "1982AAAA01"
      expect(user).to be_invalid_with_errors(unconfirmed_wca_id: ["not found"])

      user.unconfirmed_wca_id = person.wca_id
      expect(user).to be_valid
    end

    it "cannot claim a wca id already assigned to a real user" do
      user.unconfirmed_wca_id = user_with_wca_id.wca_id
      expect(user).to be_invalid_with_errors(unconfirmed_wca_id: ["already assigned to a different user"])
    end

    it "can claim a wca id already assigned to a dummy user" do
      dummy_user = FactoryBot.create :dummy_user

      user.unconfirmed_wca_id = dummy_user.wca_id
      user.dob_verification = dummy_user.person.dob.strftime("%F")
      expect(user).to be_valid
    end

    it "can match a wca id already claimed by a user" do
      user2 = FactoryBot.create :user
      user2.delegate_id_to_handle_wca_id_claim = delegate.id

      user2.unconfirmed_wca_id = person.wca_id
      user2.dob_verification = person.dob.strftime("%F")
      user.unconfirmed_wca_id = person.wca_id
      user.dob_verification = person.dob.strftime("%F")

      expect(user2).to be_valid
      expect(user).to be_valid
    end

    it "cannot have an unconfirmed_wca_id if you already have a wca_id" do
      user_with_wca_id.claiming_wca_id = true
      user_with_wca_id.unconfirmed_wca_id = person.wca_id
      user_with_wca_id.delegate_id_to_handle_wca_id_claim = delegate.id
      expect(user_with_wca_id).to be_invalid_with_errors(unconfirmed_wca_id: ["cannot claim a WCA ID because you already have WCA ID #{user_with_wca_id.wca_id}"])
    end

    context "when the delegate to handle WCA ID claim is demoted" do
      it "sets delegate_id_to_handle_wca_id_claim and unconfirmed_wca_id to nil" do
        delegate.update!(delegate_status: nil, senior_delegate_id: nil)
        user.reload
        expect(user.delegate_id_to_handle_wca_id_claim).to eq nil
        expect(user.unconfirmed_wca_id).to eq nil
      end

      it "notifies the user via email" do
        unconfirmed_user = FactoryBot.create(:user,
                                             confirmed: false,
                                             unconfirmed_wca_id: person.wca_id,
                                             delegate_id_to_handle_wca_id_claim: delegate.id,
                                             claiming_wca_id: true,
                                             dob_verification: "1990-01-2")
        expect(WcaIdClaimMailer).to receive(:notify_user_of_delegate_demotion).with(user, delegate, senior_delegate).and_call_original
        expect(WcaIdClaimMailer).not_to receive(:notify_user_of_delegate_demotion).with(unconfirmed_user, delegate, senior_delegate).and_call_original
        delegate.update!(delegate_status: nil, senior_delegate_id: nil)
      end
    end

    it "when empty, is set to nil" do
      user = FactoryBot.create :user, unconfirmed_wca_id: nil
      user.update! unconfirmed_wca_id: ""
      expect(user.reload.unconfirmed_wca_id).to eq nil
    end
  end

  it "#teams and #current_teams return unique team names" do
    user = FactoryBot.create(:user)

    FactoryBot.create(:team_member, team_id: Team.wrc.id, user_id: user.id, start_date: Date.today - 20, end_date: Date.today - 10)
    FactoryBot.create(:team_member, team_id: Team.wrt.id, user_id: user.id, start_date: Date.today - 5, end_date: Date.today + 5)
    FactoryBot.create(:team_member, team_id: Team.wrt.id, user_id: user.id, start_date: Date.today + 6, end_date: Date.today + 10)

    expect(user.teams).to match_array [Team.wrc, Team.wrt]
    expect(user.current_teams).to match_array [Team.wrt]
  end

  it 'former members of the results team are not considered current members' do
    wrt_member = FactoryBot.create :user, :wrt_member
    team_member = wrt_member.team_members.first
    team_member.update!(end_date: 1.day.ago)

    expect(wrt_member.reload.team_member?(Team.wrt)).to eq false
  end

  it 'former leaders of the results team are not considered current leaders' do
    wrt_leader = FactoryBot.create :user, :wrt_member
    team_member = wrt_leader.team_members.first
    team_member.update!(team_leader: true)
    team_member.update!(end_date: 1.day.ago)

    expect(wrt_leader.reload.team_leader?(Team.wrt)).to eq false

    expect(wrt_leader.teams_where_is_leader.count).to eq 0
  end

  it "removes whitespace around names" do
    user = FactoryBot.create :user
    user.update!(name: '  test user  ')

    expect(user.name).to eq 'test user'
  end

  describe "#update" do
    # NOTE: users are required to verify authentication recently to be able
    # to use controller's action which allow for updating attributes.
    let(:user) { FactoryBot.create(:user, password: "wca") }

    context "when the password is not given in the params" do
      it "updates the unconfirmed email" do
        user.update(email: "new@email.com")
        expect(user.reload.unconfirmed_email).to eq "new@email.com"
      end

      it "updates the password if the password_confirmation matches" do
        user.update(password: "new", password_confirmation: "new")
        expect(user.reload.valid_password?("new")).to eq true
      end

      it "does not update the password if the password_confirmation does not match" do
        user.update(password: "new", password_confirmation: "wrong")
        expect(user.reload.valid_password?("new")).to eq false
      end

      it "does not allow blank password" do
        user.update(password: " ", password_confirmation: " ")
        expect(user.errors.full_messages).to include "Password can't be blank"
      end
    end
  end

  describe "#notify_of_results_posted" do
    let(:competition) { FactoryBot.create(:competition) }

    it "sends the notification if the user has it enabled" do
      user = FactoryBot.create(:user_with_wca_id, results_notifications_enabled: true)
      expect(CompetitionsMailer).to receive(:notify_users_of_results_presence).with(user, competition).and_call_original
      user.notify_of_results_posted(competition)
    end

    it "doesn't send the notification if the user has it disabled" do
      user = FactoryBot.build(:user_with_wca_id, results_notifications_enabled: false)
      expect(CompetitionsMailer).to_not receive(:notify_users_of_results_presence).with(user, competition).and_call_original
      user.notify_of_results_posted(competition)
    end
  end

  describe "#can_view_all_users?" do
    let(:competition) { FactoryBot.create(:competition, :registration_open, :with_organizer, starts: 1.month.from_now) }

    it "returns false if the user is an organizer of an upcoming comp using registration system" do
      organizer = competition.organizers.first
      expect(organizer.can_view_all_users?).to eq false
    end

    it "returns true for board" do
      board_member = FactoryBot.create :user, :board_member
      expect(board_member.can_view_all_users?).to eq true
    end

    it "returns false for normal user" do
      normal_user = FactoryBot.create :user
      expect(normal_user.can_view_all_users?).to eq false
    end
  end

  describe "#can_edit_user?" do
    let(:user) { FactoryBot.create :user }

    it "returns true for board" do
      board_member = FactoryBot.create :user, :board_member
      expect(board_member.can_edit_user?(user)).to eq true
    end

    it "returns false for normal user" do
      normal_user = FactoryBot.create :user
      expect(normal_user.can_edit_user?(user)).to eq false
    end
  end

  describe "#editable_fields_of_user" do
    let(:competition) { FactoryBot.create(:competition, :registration_open, :with_organizer, starts: 1.month.from_now) }
    let(:registration) { FactoryBot.create(:registration, :newcomer, competition: competition) }

    it "allows organizers of upcoming competitions to edit newcomer names" do
      organizer = competition.organizers.first
      expect(organizer.can_edit_user?(registration.user)).to eq true
      expect(organizer.editable_fields_of_user(registration.user).to_a).to eq [:name]
    end

    it "allows senior delegates to assign delegate status" do
      user = FactoryBot.create :user
      senior_delegate = FactoryBot.create :senior_delegate
      expect(senior_delegate.can_edit_user?(user)).to eq true
      expect(senior_delegate.editable_fields_of_user(user).to_a).to include(:delegate_status, :region, :region_id)
    end

    it "disallows delegates to edit WCA IDs of special accounts" do
      board_member = FactoryBot.create :user, :board_member
      delegate = FactoryBot.create :delegate
      expect(delegate.can_edit_user?(board_member)).to eq true
      expect(delegate.editable_fields_of_user(board_member).to_a).not_to include(:wca_id)
    end
  end

  describe "#is_special_account" do
    it "returns false for a normal user" do
      user = FactoryBot.create :user
      expect(user.is_special_account?).to eq false
    end

    it "returns true for users on a team" do
      board_member = FactoryBot.create :user, :board_member
      banned_person = FactoryBot.create :user, :banned
      expect(board_member.is_special_account?).to eq true
      expect(banned_person.is_special_account?).to eq true
    end

    it "returns true for users that are delegates" do
      senior_delegate = FactoryBot.create :user, :senior_delegate
      expect(senior_delegate.is_special_account?).to eq true
    end

    it "returns true for users who organized or delegated a competition" do
      organizer = FactoryBot.create :user
      delegate = FactoryBot.create :user # Intentionally not assigning a Delegate role as it is possible to Delegate a competition without being a current Delegate
      trainee_delegate = FactoryBot.create :user
      FactoryBot.create :competition, organizers: [organizer], delegates: [delegate, trainee_delegate]
      expect(organizer.is_special_account?).to eq true
      expect(delegate.is_special_account?).to eq true
      expect(trainee_delegate.is_special_account?).to eq true
    end
  end

  describe "birthdate validations" do
    it "requires birthdate in past" do
      user = FactoryBot.create :user
      user.dob = 5.days.from_now
      expect(user).to be_invalid_with_errors(dob: ["must be in the past"])
    end

    it "requires user over two years old" do
      user = FactoryBot.create :user
      user.dob = 5.days.ago
      expect(user).to be_invalid_with_errors(dob: ["must be at least two years old"])
    end
  end

  describe "receive_delegate_reports field" do
    let!(:staff_member1) { FactoryBot.create :user, :wec_member, receive_delegate_reports: true }
    let!(:staff_member2) { FactoryBot.create :user, :wrt_member, receive_delegate_reports: false }

    it "gets cleared if user is not eligible anymore" do
      former_staff_member = FactoryBot.create :user, receive_delegate_reports: true
      User.clear_receive_delegate_reports_if_not_eligible
      expect(former_staff_member.reload.receive_delegate_reports).to eq false
      expect(staff_member1.reload.receive_delegate_reports).to eq true
    end

    it "adds to reports@ only current staff members who want to receive reports" do
      expect(User.delegate_reports_receivers_emails).to eq ["seniors@worldcubeassociation.org", "quality@worldcubeassociation.org", "regulations@worldcubeassociation.org", staff_member1.email]
    end
  end

  describe "#can_manage_any_not_over_competitions?" do
    let!(:manager_upcoming_and_past) { FactoryBot.create :user }
    let!(:manager_past_only) { FactoryBot.create :user }
    let!(:upcoming_competition) { FactoryBot.create :competition, starts: 1.month.from_now, organizers: [manager_upcoming_and_past] }
    let!(:past_competition) { FactoryBot.create :competition, starts: 1.month.ago, organizers: [manager_past_only, manager_upcoming_and_past] }

    it "knows if you are managing upcoming competitions" do
      expect(manager_upcoming_and_past.can_manage_any_not_over_competitions?).to be true
    end

    it "knows if you only managed past competitions" do
      expect(manager_past_only.can_manage_any_not_over_competitions?).to be false
    end
  end

  describe "can edit registration" do
    let!(:competitor) { FactoryBot.create :user }
    let!(:organizer) { FactoryBot.create :user }
    let!(:competition) { FactoryBot.create :competition, :registration_open, organizers: [organizer] }
    let!(:registration) { FactoryBot.create :registration, user: competitor, competition: competition }

    it "if they are an organizer" do
      expect(organizer.can_edit_registration?(registration)).to be true
    end

    it "if their registration is pending" do
      registration.accepted_at = nil
      expect(competitor.can_edit_registration?(registration)).to be true
    end

    it "unless their registration is accepted" do
      registration.accepted_at = Time.now
      expect(competitor.can_edit_registration?(registration)).to be false
    end

    it "if event edit deadline is in the future" do
      registration.accepted_at = Time.now
      competition.allow_registration_edits = true
      competition.event_change_deadline_date = 2.weeks.from_now
      expect(competitor.can_edit_registration?(registration)).to be true
    end

    it "unless event edit deadline has passed" do
      registration.accepted_at = Time.now
      competition.allow_registration_edits = true
      competition.event_change_deadline_date = 2.weeks.ago
      expect(competitor.can_edit_registration?(registration)).to be false
    end
  end

  describe "can self-delete registration" do
    let!(:competitor) { FactoryBot.create :user }
    let!(:competition) { FactoryBot.create :competition, :registration_open }
    let!(:registration) { FactoryBot.create :registration, user: competitor, competition: competition }

    it "if their registration is pending" do
      registration.accepted_at = nil
      competition.allow_registration_self_delete_after_acceptance = false
      expect(competitor.can_delete_registration?(registration)).to be true
      competition.allow_registration_self_delete_after_acceptance = true
      expect(competitor.can_delete_registration?(registration)).to be true
    end

    it "if their registration is accepted and the competition still allows deletion" do
      registration.accepted_at = Time.now
      competition.allow_registration_self_delete_after_acceptance = true
      expect(competitor.can_delete_registration?(registration)).to be true
    end

    it "unless their registration is accepted and the competition does not allow deletion afterwards" do
      registration.accepted_at = Time.now
      competition.allow_registration_self_delete_after_acceptance = false
      expect(competitor.can_delete_registration?(registration)).to be false
    end
  end
end
