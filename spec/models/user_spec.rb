# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User do
  let(:dob_form_path) { Rails.application.routes.url_helpers.contact_dob_path }
  let(:wrt_contact_path) { Rails.application.routes.url_helpers.contact_path(contactRecipient: 'wrt') }

  it "defines a valid user" do
    user = create(:user)
    expect(user).to be_valid
  end

  it "defines a dummy user" do
    user = create(:dummy_user)
    expect(user).to be_valid
    expect(user.dummy_account?).to be true
    users = User.search("")
    expect(users.count).to eq 0
  end

  it "search can find people who never logged in, but aren't dummy accounts" do
    user = create(:user, encrypted_password: "")
    expect(user.dummy_account?).to be false
    users = User.search("")
    expect(users.count).to eq 1
    expect(users.first).to eq user
  end

  it "search returns only people with sub_id 1" do
    create(:person, wca_id: "2005FLEI01", sub_id: 1)
    create(:person, wca_id: "2005FLEI01", sub_id: 2)
    create(:user, wca_id: "2005FLEI01")

    users = User.search("2005FLEI01", params: { persons_table: true })
    expect(users.count).to eq 1
    expect(users[0].sub_id).to eq 1
  end

  it "allows empty country" do
    user = build(:user, country_iso2: "")
    expect(user).to be_valid

    user = build(:user, country_iso2: nil)
    expect(user).to be_valid
  end

  it "allows valid fancy email" do
    user = build(:user, email: "aa124_qs.totof+topic@gmail.com")
    expect(user).to be_valid
  end

  it "invalidates silly typos in email" do
    user = build(:user, email: "aa@bbb,com")
    expect(user).to be_invalid_with_errors(email: ["is invalid"])

    user = build(:user, email: "aabbb.com")
    expect(user).to be_invalid_with_errors(email: ["is invalid"])

    user = build(:user, email: "john@gmail..com")
    expect(user).to be_invalid_with_errors(email: ["is invalid"])
  end

  it "can confirm a user who has never competed before" do
    user = build(:user, unconfirmed_wca_id: "")
    user.confirm
  end

  it "doesn't delete a real account when a dummy account's WCA ID is cleared" do
    # Create someone without a password and without a WCA ID. This simulates the kind
    # of accounts we originally created for all delegates without accounts.
    delegate = create(:delegate, encrypted_password: "", wca_id: nil)

    dummy_user = create(:dummy_user)
    dummy_user.wca_id = nil
    dummy_user.save!
    expect(User.find(delegate.id)).to eq delegate
  end

  it "does not give delegates results admin privileges" do
    delegate = create(:delegate)
    expect(delegate.can_admin_results?).to be false
  end

  describe "WCA ID" do
    let(:user) { create(:user_with_wca_id) }
    let(:birthdayless_person) { create(:person, :missing_dob, :skip_validation) }
    let(:genderless_person) { create(:person, :missing_gender) }

    it "validates WCA ID" do
      user = build(:user, wca_id: "2005FLEI02")
      expect(user).not_to be_valid

      user = build(:user, wca_id: "2005FLE01")
      expect(user).to be_invalid_with_errors(wca_id: ["is invalid", "not found"])

      user = build(:user, wca_id: "200FLEI01")
      expect(user).to be_invalid_with_errors(wca_id: ["is invalid", "not found"])

      user = build(:user, wca_id: "200FLEI0")
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
      expect(user).to be_invalid_with_errors(wca_id: [I18n.t('users.errors.wca_id_no_gender_html', wrt_contact_path: wrt_contact_path)])
    end

    it "nullifies empty WCA IDs" do
      # Verify that we can create multiple users with empty wca_ids
      user2 = create(:user, wca_id: "")
      expect(user2.wca_id).to be_nil

      user.wca_id = ""
      user.save!
      expect(user.wca_id).to be_nil
    end

    context "when WCA ID is not unique" do
      let(:existing_user) { create(:user_with_wca_id) }
      let(:invalid_user) { build(:user, wca_id: existing_user.wca_id) }

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
      dummy_user = create(:dummy_user)
      person_for_dummy = dummy_user.person
      expect(dummy_user).to be_valid
      dummy_avatar = create(
        :user_avatar,
        user: dummy_user,
      )
      expect(dummy_avatar).to be_valid
      dummy_user.update!(current_avatar: dummy_avatar)
      expect(dummy_user.avatar.filename).to eq(dummy_avatar.filename)

      # Assigning a WCA ID to user should copy over the name from the Persons table.
      expect(user.name).to eq user.person.name
      user.wca_id = dummy_user.wca_id
      user.save!
      expect(user.name).to eq person_for_dummy.name

      # Check that the dummy account was deleted, and we inherited its avatar.
      expect(User.find_by(id: dummy_user.id)).to be_nil
      expect(user.reload.avatar).to eq dummy_avatar
    end

    it "does not allow duplicate WCA IDs" do
      user2 = create(:user)
      expect(user2).to be_valid
      user2.wca_id = user.wca_id
      expect(user2).not_to be_valid
    end

    it "does not allows assigning WCA ID if user and person details don't match" do
      user = create(:user, name: "Whatever", country_iso2: "US", dob: Date.new(1950, 12, 12), gender: "m")
      person = create(:person, name: "Else", country_id: "United Kingdom", dob: '1900-01-01', gender: "f")
      user.wca_id = person.wca_id
      expect(user).to be_invalid_with_errors(
        name: [I18n.t('users.errors.must_match_person')],
        country_iso2: [I18n.t('users.errors.must_match_person')],
        dob: [I18n.t('users.errors.must_match_person')],
        gender: [I18n.t('users.errors.must_match_person')],
      )
    end
  end

  describe "#assign_wca_id" do
    let(:person) { create(:person) }
    let(:user) { create(:user, name: person.name, dob: person.dob, country_iso2: person.country_iso2, gender: person.gender) }

    it "assigns the WCA ID to the user" do
      user.assign_wca_id(person.wca_id)
      expect(user.wca_id).to eq person.wca_id
    end

    it "is a no-op when wca_id is blank" do
      user.assign_wca_id("")
      expect(user.wca_id).to be_nil
    end

    it "raises if the user already has a WCA ID" do
      user_with_id = create(:user_with_wca_id)
      expect { user_with_id.assign_wca_id(person.wca_id) }.to raise_error(RuntimeError, /already has WCA ID/)
    end

    it "clears potential duplicate persons for the user" do
      job_run = DuplicateCheckerJobRun.create!(competition: create(:competition), run_status: :not_started)
      PotentialDuplicatePerson.create!(duplicate_checker_job_run_id: job_run.id, original_user: user, duplicate_person: person, name_matching_algorithm: :jarowinkler, score: 90)

      expect { user.assign_wca_id(person.wca_id) }
        .to change { user.potential_duplicate_persons.count }.from(1).to(0)
    end

    context "when other users have pending claims for the same WCA ID" do
      let(:delegate_role) { create(:delegate_role) }
      let!(:claimant1) do
        create(:user, unconfirmed_wca_id: person.wca_id, delegate_id_to_handle_wca_id_claim: delegate_role.user.id, dob_verification: person.dob.to_s)
      end
      let!(:claimant2) do
        create(:user, unconfirmed_wca_id: person.wca_id, delegate_id_to_handle_wca_id_claim: delegate_role.user.id, dob_verification: person.dob.to_s)
      end

      it "clears unconfirmed_wca_id and delegate fields on stale claimants" do
        user.assign_wca_id(person.wca_id)

        expect(claimant1.reload.unconfirmed_wca_id).to be_nil
        expect(claimant1.delegate_id_to_handle_wca_id_claim).to be_nil
        expect(claimant2.reload.unconfirmed_wca_id).to be_nil
        expect(claimant2.delegate_id_to_handle_wca_id_claim).to be_nil
      end

      it "sends a cancellation email to each stale claimant" do
        allow(WcaIdClaimMailer).to receive(:notify_user_of_claim_cancelled)
          .with(claimant1, person.wca_id).and_return(double(deliver_later: nil))
        allow(WcaIdClaimMailer).to receive(:notify_user_of_claim_cancelled)
          .with(claimant2, person.wca_id).and_return(double(deliver_later: nil))

        user.assign_wca_id(person.wca_id)
      end
    end

    context "when the user itself has a pending claim for the same WCA ID" do
      let(:delegate_role) { create(:delegate_role) }

      before do
        user.update!(unconfirmed_wca_id: person.wca_id, delegate_id_to_handle_wca_id_claim: delegate_role.user.id, dob_verification: person.dob.to_s)
      end

      it "does not send a cancellation email to the user being assigned" do
        expect(WcaIdClaimMailer).not_to receive(:notify_user_of_claim_cancelled).with(user, person.wca_id)
        user.assign_wca_id(person.wca_id)
      end

      it "still assigns the WCA ID" do
        user.assign_wca_id(person.wca_id)
        expect(user.reload.wca_id).to eq person.wca_id
      end
    end
  end

  it "can create user with empty password" do
    create(:user, encrypted_password: "")
  end

  it "can handle missing avatar" do
    user = create(:user)
    user.current_avatar = nil
    user.save!
  end

  it "clearing avatar backfills nil on both fields" do
    user = create(:user_with_wca_id, :with_avatar, :with_pending_avatar)
    expect(user.current_avatar).not_to be_nil
    user.current_avatar.update!(status: 'deleted')
    expect(user.current_avatar).to be_nil
    expect(user.pending_avatar).not_to be_nil
    user.pending_avatar.update!(status: 'deleted')
    expect(user.pending_avatar).to be_nil
  end

  it "approving pending avatar moves association" do
    user = create(:user_with_wca_id, :with_pending_avatar)
    user.pending_avatar.update!(status: 'approved')

    expect(user.current_avatar).not_to be_nil
    expect(user.pending_avatar).to be_nil
  end

  it "approving pending avatar triggers a removal job" do
    user = create(:user_with_wca_id, :with_pending_avatar)
    avatar = user.pending_avatar

    perform_enqueued_jobs do
      avatar.update!(status: 'approved')
    end

    assert_performed_jobs 1, only: ActiveStorage::PurgeJob
  end

  it "approving pending avatar moves file from private to public" do
    user = create(:user_with_wca_id, :with_pending_avatar)
    avatar = user.pending_avatar

    expect(avatar.public_image.attached?).to be false
    expect(avatar.private_image.attached?).to be true

    avatar.update!(status: 'approved')

    # Make sure we actually purge the file
    perform_enqueued_jobs

    expect(avatar.public_image.attached?).to be true
    expect(avatar.private_image.attached?).to be false
  end

  it "deprecating approved avatar moves file from public to private" do
    user = create(:user_with_wca_id, :with_avatar)
    avatar = user.current_avatar

    expect(avatar.public_image.attached?).to be true
    expect(avatar.private_image.attached?).to be false

    avatar.update!(status: 'deprecated')

    # Make sure we actually purge the file
    perform_enqueued_jobs

    expect(avatar.public_image.attached?).to be false
    expect(avatar.private_image.attached?).to be true
  end

  describe "#delegated_competitions" do
    let(:delegate) { create(:delegate) }
    let(:other_delegate) { create(:delegate) }
    let!(:confirmed_competition1) { create(:competition, delegates: [delegate]) }
    let!(:confirmed_competition2) { create(:competition, delegates: [delegate]) }
    let!(:unconfirmed_competition1) { create(:competition, delegates: [delegate]) }
    let!(:unconfirmed_competition2) { create(:competition, delegates: [delegate]) }
    let!(:other_delegate_unconfirmed_competition) { create(:competition, delegates: [other_delegate]) }

    it "sees delegated competitions" do
      expect(delegate.delegated_competitions).to contain_exactly(confirmed_competition1, confirmed_competition2, unconfirmed_competition1, unconfirmed_competition2)
    end
  end

  describe "#organized_competitions" do
    let(:user) { create(:user) }
    let(:competition) { create(:competition, organizers: [user]) }

    it "sees organized competitions" do
      expect(user.organized_competitions).to eq [competition]
    end
  end

  describe "check if registration form sends mail to newly registered user" do
    it "sends mail" do
      user = build(:user, confirmed: false)
      expect(NewRegistrationMailer).to receive(:send_registration_mail).with(user).and_call_original
      user.save!
    end
  end

  describe "unconfirmed_wca_id" do
    let!(:person) { create(:person, dob: '1990-01-02') }
    let!(:delegate_role) { create(:delegate_role) }
    let!(:user) do
      create(:user, unconfirmed_wca_id: person.wca_id,
                    delegate_id_to_handle_wca_id_claim: delegate_role.user.id,
                    claiming_wca_id: true,
                    dob_verification: "1990-01-2")
    end

    let!(:person_without_dob) { create(:person, :skip_validation, dob: nil) }
    let!(:person_without_gender) { create(:person, gender: nil) }
    let!(:user_with_wca_id) { create(:user_with_wca_id) }

    it "defines a valid user" do
      expect(user).to be_valid

      # The database object without the unpersisted fields like dob_verification should
      # also be valid.
      expect(User.find(user.id)).to be_valid
    end

    it "doesn't allow user to change unconfirmed_wca_id" do
      expect(user).to be_valid
      user.claiming_wca_id = false
      other_person = create(:person, dob: '1980-02-01')
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
      expect(user).to be_invalid_with_errors(gender: [I18n.t('users.errors.wca_id_no_gender_html', wrt_contact_path: wrt_contact_path)])
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
      dummy_user = create(:dummy_user)

      user.unconfirmed_wca_id = dummy_user.wca_id
      user.dob_verification = dummy_user.person.dob.strftime("%F")
      expect(user).to be_valid
    end

    it "can match a wca id already claimed by a user" do
      user2 = create(:user)
      user2.delegate_id_to_handle_wca_id_claim = delegate_role.user.id

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
      user_with_wca_id.delegate_id_to_handle_wca_id_claim = delegate_role.user.id
      expect(user_with_wca_id).to be_invalid_with_errors(unconfirmed_wca_id: ["cannot claim a WCA ID because you already have WCA ID #{user_with_wca_id.wca_id}"])
    end

    it "when empty, is set to nil" do
      user = create(:user, unconfirmed_wca_id: nil)
      user.update! unconfirmed_wca_id: ""
      expect(user.reload.unconfirmed_wca_id).to be_nil
    end
  end

  it 'banned? returns true for users who are actively banned' do
    banned_user = create(:user, :banned)

    expect(banned_user.banned?).to be true
  end

  it 'banned? returns false for users who are banned in past' do
    formerly_banned_user = create(:user, :formerly_banned)

    expect(formerly_banned_user.banned?).to be false
  end

  it 'current_ban returns data of current banned role' do
    banned_user = create(:user, :banned)

    expect(banned_user.current_ban.group.group_type).to eq UserGroup.group_types[:banned_competitors]
  end

  it "removes whitespace around names" do
    user = create(:user)
    user.update!(name: '  test user  ')

    expect(user.name).to eq 'test user'
  end

  describe "#update" do
    # NOTE: users are required to verify authentication recently to be able
    # to use controller's action which allow for updating attributes.
    let(:user) { create(:user, password: "wca") }

    context "when the password is not given in the params" do
      it "updates the unconfirmed email" do
        user.update(email: "new@email.com")
        expect(user.reload.unconfirmed_email).to eq "new@email.com"
      end

      it "updates the password if the password_confirmation matches" do
        user.update(password: "new", password_confirmation: "new")
        expect(user.reload.valid_password?("new")).to be true
      end

      it "does not update the password if the password_confirmation does not match" do
        user.update(password: "new", password_confirmation: "wrong")
        expect(user.reload.valid_password?("new")).to be false
      end

      it "does not allow blank password" do
        user.update(password: " ", password_confirmation: " ")
        expect(user.errors.full_messages).to include "Password can't be blank"
      end
    end
  end

  describe "#notify_of_results_posted" do
    let(:competition) { create(:competition) }

    it "sends the notification if the user has it enabled" do
      user = create(:user_with_wca_id, results_notifications_enabled: true)
      expect(CompetitionsMailer).to receive(:notify_users_of_results_presence).with(user, competition).and_call_original
      user.notify_of_results_posted(competition)
    end

    it "doesn't send the notification if the user has it disabled" do
      user = build(:user_with_wca_id, results_notifications_enabled: false)
      expect(CompetitionsMailer).not_to receive(:notify_users_of_results_presence).with(user, competition).and_call_original
      user.notify_of_results_posted(competition)
    end
  end

  describe "#can_view_all_users?" do
    let(:competition) { create(:competition, :registration_open, :with_organizer, starts: 1.month.from_now) }

    it "returns false if the user is an organizer of an upcoming comp using registration system" do
      organizer = competition.organizers.first
      expect(organizer.can_view_all_users?).to be false
    end

    it "returns true for board" do
      board_member = create(:user, :board_member)
      expect(board_member.can_view_all_users?).to be true
    end

    it "returns false for normal user" do
      normal_user = create(:user)
      expect(normal_user.can_view_all_users?).to be false
    end
  end

  describe "#can_edit_user?" do
    let(:user) { create(:user) }

    it "returns true for board" do
      board_member = create(:user, :board_member)
      expect(board_member.can_edit_user?(user)).to be true
    end

    it "returns false for normal user" do
      normal_user = create(:user)
      expect(normal_user.can_edit_user?(user)).to be false
    end
  end

  describe "#editable_fields_of_user" do
    let(:competition) { create(:competition, :registration_open, :with_organizer, starts: 1.month.from_now) }
    let(:registration) { create(:registration, :newcomer, competition: competition) }

    it "allows organizers of upcoming competitions to edit first-timer names" do
      organizer = competition.organizers.first
      expect(organizer.can_edit_user?(registration.user)).to be true
      expect(organizer.editable_fields_of_user(registration.user).to_a).to eq [:name]
    end

    it "disallows delegates to edit WCA IDs of special accounts" do
      board_member = create(:user, :board_member)
      delegate = create(:delegate)
      expect(delegate.can_edit_user?(board_member)).to be true
      expect(delegate.editable_fields_of_user(board_member).to_a).not_to include(:wca_id)
    end
  end

  describe "#is_special_account" do
    it "returns false for a normal user" do
      user = create(:user)
      expect(user.special_account?).to be false
    end

    it "returns true for users on a team" do
      board_member = create(:user, :board_member)
      banned_person = create(:user, :banned)
      expect(board_member.special_account?).to be true
      expect(banned_person.special_account?).to be true
    end

    it "returns true for users that are delegates" do
      senior_delegate_role = create(:senior_delegate_role)
      expect(senior_delegate_role.user.special_account?).to be true
    end

    it "returns true for users who organized or delegated a competition" do
      organizer = create(:user)
      delegate = create(:user) # Intentionally not assigning a Delegate role as it is possible to Delegate a competition without being a current Delegate
      trainee_delegate = create(:user)
      create(:competition, organizers: [organizer], delegates: [delegate, trainee_delegate])
      expect(organizer.special_account?).to be true
      expect(delegate.special_account?).to be true
      expect(trainee_delegate.special_account?).to be true
    end
  end

  describe "birthdate validations" do
    it "requires birthdate in past" do
      user = create(:user)
      user.dob = 5.days.from_now
      expect(user).to be_invalid_with_errors(dob: ["must be in the past"])
    end

    it "requires user over two years old" do
      user = create(:user)
      user.dob = 5.days.ago
      expect(user).to be_invalid_with_errors(dob: ["must be at least two years old"])
    end
  end

  describe "receive_delegate_reports field" do
    let!(:staff_member1) { create(:user, :wic_member, receive_delegate_reports: true) }
    let!(:staff_member2) { create(:user, :wrt_member, receive_delegate_reports: false) }
    let!(:staff_member3) { create(:user, :wrc_member, receive_delegate_reports: true, delegate_reports_region: Country.c_find('USA')) }

    it "gets cleared if user is not eligible anymore" do
      former_staff_member = create(:user, receive_delegate_reports: true)
      User.clear_receive_delegate_reports_if_not_eligible
      expect(former_staff_member.reload.receive_delegate_reports).to be false
      expect(staff_member1.reload.receive_delegate_reports).to be true
    end

    it "adds to reports@ only current staff members who want to receive reports" do
      expect(User.delegate_reports_receivers_emails).to contain_exactly("seniors@worldcubeassociation.org", "quality@worldcubeassociation.org", "regulations@worldcubeassociation.org", staff_member1.email)
      expect(User.delegate_reports_receivers_emails(Country.c_find('USA'))).to contain_exactly(staff_member3.email)
    end
  end

  describe "#can_manage_any_not_over_competitions?" do
    let!(:manager_upcoming_and_past) { create(:user) }
    let!(:manager_past_only) { create(:user) }
    let!(:upcoming_competition) { create(:competition, starts: 1.month.from_now, organizers: [manager_upcoming_and_past]) }
    let!(:past_competition) { create(:competition, starts: 1.month.ago, organizers: [manager_past_only, manager_upcoming_and_past]) }

    it "knows if you are managing upcoming competitions" do
      expect(manager_upcoming_and_past.can_manage_any_not_over_competitions?).to be true
    end

    it "knows if you only managed past competitions" do
      expect(manager_past_only.can_manage_any_not_over_competitions?).to be false
    end
  end

  describe "can edit registration" do
    let!(:competitor) { create(:user) }
    let!(:organizer) { create(:user) }
    let!(:competition) { create(:competition, :registration_open, organizers: [organizer]) }
    let!(:registration) { create(:registration, user: competitor, competition: competition) }

    it "if they are an organizer" do
      expect(organizer.can_edit_registration?(registration)).to be true
    end

    it "if their registration is pending" do
      registration.competing_status = Registrations::Helper::STATUS_PENDING
      expect(competitor.can_edit_registration?(registration)).to be true
    end

    it "unless their registration is accepted" do
      registration.competing_status = Registrations::Helper::STATUS_ACCEPTED
      expect(competitor.can_edit_registration?(registration)).to be false
    end

    it "if event edit deadline is in the future" do
      registration.competing_status = Registrations::Helper::STATUS_ACCEPTED
      competition.allow_registration_edits = true
      competition.event_change_deadline_date = 2.weeks.from_now
      expect(competitor.can_edit_registration?(registration)).to be true
    end

    it "unless event edit deadline has passed" do
      registration.competing_status = Registrations::Helper::STATUS_ACCEPTED
      competition.allow_registration_edits = true
      competition.event_change_deadline_date = 2.weeks.ago
      expect(competitor.can_edit_registration?(registration)).to be false
    end
  end

  describe "staff? method" do
    it "returns false for non-staff user" do
      user = create(:user)
      expect(user.staff?).to be false
    end

    it "returns false for trainee delegate" do
      user = create(:trainee_delegate)
      expect(user.staff?).to be false
    end

    it "returns true for non-trainee Delegate roles" do
      junior_delegate_user = create(:junior_delegate)
      full_delegate_user = create(:delegate)
      regional_delegate = create(:regional_delegate_role)
      senior_delegate = create(:senior_delegate_role)

      expect(junior_delegate_user.staff?).to be true
      expect(full_delegate_user.staff?).to be true
      expect(regional_delegate.user.staff?).to be true
      expect(senior_delegate.user.staff?).to be true
    end

    it "returns true for WST member" do
      user = create(:user, :wst_member)
      expect(user.staff?).to be true
    end

    it "returns true for Board roles" do
      user = create(:user, :board_member)
      expect(user.staff?).to be true
    end

    it "returns true for Officer roles" do
      executive_director = create(:executive_director_role)
      chair = create(:chair_role)
      vice_chair = create(:vice_chair_role)
      secretary = create(:secretary_role)
      treasurer = create(:treasurer_role)

      expect(executive_director.user.staff?).to be true
      expect(chair.user.staff?).to be true
      expect(vice_chair.user.staff?).to be true
      expect(secretary.user.staff?).to be true
      expect(treasurer.user.staff?).to be true
    end
  end

  describe "has_permission? method" do
    it "returns false for any permissions that are not defined" do
      user = create(:user)
      expect(user.has_permission?(:not_defined_permission)).to be false
    end

    it "returns true for board user for any group" do
      americas_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'americas').user_group
      board_user = create(:user, :board_member)
      expect(board_user.has_permission?(:can_edit_groups, americas_region.id)).to be true
    end

    it "returns true for WRT user for any group" do
      americas_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'americas').user_group
      wrt_user = create(:user, :wrt_member)
      expect(wrt_user.has_permission?(:can_edit_groups, americas_region.id)).to be true
    end

    it "returns true for admin user for any group" do
      americas_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'americas').user_group
      admin_user = create(:admin)
      expect(admin_user.has_permission?(:can_edit_groups, americas_region.id)).to be true
    end

    it "returns true for senior delegate if scope requested is own region" do
      senior_delegate_role = create(:senior_delegate_role)
      expect(senior_delegate_role.user.has_permission?(:can_edit_groups, senior_delegate_role.group.id)).to be true
    end

    it "returns true for senior delegate if scope requested is their subregion" do
      asia_east_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia-east').user_group
      senior_delegate = create(:senior_delegate_role, group: asia_east_region.parent_group).user
      expect(senior_delegate.has_permission?(:can_edit_groups, asia_east_region.id)).to be true
    end

    it "returns false for senior delegate if scope requested is other's region" do
      asia_region = GroupsMetadataDelegateRegions.find_by!(friendly_id: 'asia').user_group
      senior_delegate = create(:senior_delegate_role).user
      expect(senior_delegate.has_permission?(:can_edit_groups, asia_region.id)).to be false
    end
  end

  describe "teams_committees_at_least_senior_roles has_many relation" do
    it "returns the senior/leader roles for a user" do
      user = create(:user)
      wrt_role = create(:wrt_member_role, user: user)
      wsot_leader_role = create(:wsot_leader_role, user: user)
      wrc_senior_member_role = create(:wrc_senior_member_role, user: user)
      expect(user.teams_committees_at_least_senior_roles).to include(wsot_leader_role, wrc_senior_member_role)
      expect(user.teams_committees_at_least_senior_roles).not_to include(wrt_role)
    end
  end

  describe '#below_forum_age_requirement?' do
    let(:user) { create(:user) }

    it 'true when user under 13' do
      user.dob = Date.today.advance(days: 1, years: -13)
      expect(user.below_forum_age_requirement?).to be(true)
    end

    it 'false when user is exactly 13' do
      user.dob = Date.today.advance(years: -13)
      expect(user.below_forum_age_requirement?).to be(false)
    end

    it 'false when user older than 13' do
      user.dob = Date.today.advance(days: -1, years: -13)
      expect(user.below_forum_age_requirement?).to be(false)
    end
  end

  describe '#can_check_newcomers_data?' do
    let(:competition_delegate) { create(:delegate) }
    let(:competition) { create(:competition, :announced, starts: 1.month.from_now, delegates: [competition_delegate]) }

    it "returns true for WRT" do
      wrt_user = create(:user, :wrt_member)

      expect(wrt_user.can_check_newcomers_data?(competition)).to be true
    end

    it "returns true for competition delegate" do
      expect(competition_delegate.can_check_newcomers_data?(competition)).to be true
    end

    it "returns true for competition organizer who is also a delegate" do
      organizer_delegate = create(:delegate)
      competition.organizers << organizer_delegate
      competition.delegates << organizer_delegate

      expect(organizer_delegate.can_check_newcomers_data?(competition)).to be true
    end

    it "returns false for competition organizer who is not a delegate" do
      organizer = create(:user)
      competition.organizers << organizer

      expect(organizer.can_check_newcomers_data?(competition)).to be false
    end

    it "returns false for delegate of another competition" do
      other_delegate = create(:delegate)
      create(:competition, :announced, starts: 1.month.from_now, delegates: [other_delegate])

      expect(other_delegate.can_check_newcomers_data?(competition)).to be false
    end

    it "returns false for non-WRT user" do
      user = create(:user)

      expect(user.can_check_newcomers_data?(competition)).to be false
    end
  end

  describe '#can_upload_competition_results?' do
    let(:wrt_member) { create(:user, :wrt_member) }
    let(:competition_delegate) { create(:delegate) }
    let(:normal_user) { create(:user) }

    context 'when competition is upcoming' do
      let(:competition) { create(:competition, :announced, starts: 1.month.from_now, delegates: [competition_delegate]) }

      it "returns false for WRT member" do
        expect(wrt_member.can_upload_competition_results?(competition)).to be false
      end

      it "returns false for competition Delegate" do
        expect(competition_delegate.can_upload_competition_results?(competition)).to be false
      end

      it "returns false for normal user" do
        expect(normal_user.can_upload_competition_results?(competition)).to be false
      end
    end

    context 'when competition is not announced' do
      let(:competition) { create(:competition, :not_visible, starts: 1.month.ago, delegates: [competition_delegate]) }

      it "returns false for WRT member" do
        expect(wrt_member.can_upload_competition_results?(competition)).to be false
      end

      it "returns false for competition Delegate" do
        expect(competition_delegate.can_upload_competition_results?(competition)).to be false
      end

      it "returns false for normal user" do
        expect(normal_user.can_upload_competition_results?(competition)).to be false
      end
    end

    context 'when competition results are posted' do
      let(:competition) { create(:competition, :announced, :results_posted, starts: 1.month.ago, delegates: [competition_delegate]) }

      it "returns true for WRT member" do
        expect(wrt_member.can_upload_competition_results?(competition)).to be true
      end

      it "returns false for competition Delegate" do
        expect(competition_delegate.can_upload_competition_results?(competition)).to be false
      end

      it "returns false for normal user" do
        expect(normal_user.can_upload_competition_results?(competition)).to be false
      end
    end

    context 'when competition results are not posted' do
      let(:competition) { create(:competition, :announced, starts: 1.month.ago, delegates: [competition_delegate]) }

      it "returns true for WRT member" do
        expect(wrt_member.can_upload_competition_results?(competition)).to be true
      end

      it "returns true for competition Delegate" do
        expect(competition_delegate.can_upload_competition_results?(competition)).to be true
      end

      it "returns false for normal user" do
        expect(normal_user.can_upload_competition_results?(competition)).to be false
      end
    end
  end

  describe '#can_submit_competition_results?' do
    let(:wrt_member) { create(:user, :wrt_member) }
    let(:staff_delegate) { create(:delegate) }
    let(:trainee_delegate) { create(:trainee_delegate) }
    let(:competition) { create(:competition, :announced, starts: 1.month.ago, delegates: [staff_delegate, trainee_delegate]) }

    it "returns true for WRT member" do
      expect(wrt_member.can_submit_competition_results?(competition)).to be true
    end

    it "returns true for staff Delegate" do
      expect(staff_delegate.can_submit_competition_results?(competition)).to be true
    end

    it "returns false for trainee Delegate" do
      expect(trainee_delegate.can_submit_competition_results?(competition)).to be false
    end
  end

  describe '#my_competitions', :clean_db_with_truncation do
    let(:delegate) { create(:delegate) }
    let(:organizer) { create(:user) }
    let!(:future_competition1) { create(:competition, :registration_open, starts: 5.weeks.from_now, organizers: [organizer], delegates: [delegate], events: Event.where(id: %w[222 333])) }
    let!(:future_competition2) { create(:competition, :registration_open, starts: 4.weeks.from_now, organizers: [organizer], events: Event.where(id: %w[222 333])) }
    let!(:future_competition3) { create(:competition, :registration_open, starts: 3.weeks.from_now, organizers: [organizer], events: Event.where(id: %w[222 333])) }
    let!(:future_competition4) { create(:competition, :registration_open, starts: 3.weeks.from_now, organizers: [], events: Event.where(id: %w[222 333])) }
    let!(:past_competition1) { create(:competition, starts: 1.month.ago, organizers: [organizer], events: Event.where(id: %w[222 333])) }
    let!(:past_competition2) { create(:competition, starts: 2.months.ago, delegates: [delegate], events: Event.where(id: %w[222 333])) }
    let!(:past_competition3) { create(:competition, starts: 3.months.ago, delegates: [delegate], events: Event.where(id: %w[222 333])) }
    let!(:past_competition4) { create(:competition, :results_posted, starts: 4.months.ago, delegates: [delegate], events: Event.where(id: %w[222 333])) }
    let!(:unscheduled_competition1) { create(:competition, starts: nil, ends: nil, delegates: [delegate], events: Event.where(id: %w[222 333])) }
    let(:registered_user) { create(:user, name: "Jan-Ove Waldner") }
    let!(:registration1) { create(:registration, :accepted, competition: future_competition1, user: registered_user) }
    let!(:registration2) { create(:registration, :accepted, competition: future_competition3, user: registered_user) }
    let!(:registration3) { create(:registration, :accepted, competition: past_competition1, user: registered_user) }
    let!(:registration4) { create(:registration, :accepted, competition: past_competition3, user: organizer) }
    let!(:registration5) { create(:registration, :accepted, competition: future_competition3, user: delegate) }
    let!(:results_person) { create(:person, wca_id: "2014PLUM01", name: "Jeff Plumb") }
    let!(:results_user) { create(:user, name: "Jeff Plumb", wca_id: "2014PLUM01") }
    let!(:result) { create(:result, person: results_person, competition: past_competition1) }

    context 'for a user with results for a comp they did not register for' do
      it 'shows my upcoming and past competitions' do
        grouped_competitions, = results_user.my_competitions

        expect(grouped_competitions[:future]).to eq []
        expect(grouped_competitions[:past]).to eq [past_competition1]
      end
    end

    context 'for a regular user' do
      it 'shows my upcoming and past competitions' do
        grouped_competitions, = registered_user.my_competitions

        expect(grouped_competitions[:future]).to eq [future_competition1, future_competition3]
        expect(grouped_competitions[:past]).to eq [past_competition1]
      end

      it 'does not show past competitions they have a rejected registration for' do
        create(:registration, :rejected, competition: past_competition2, user: registered_user)

        grouped_competitions, = registered_user.my_competitions

        expect(grouped_competitions[:future]).to eq [future_competition1, future_competition3]
        expect(grouped_competitions[:past]).to eq [past_competition1]
      end

      it 'does not show upcoming competitions they have a rejected registration for' do
        create(:registration, :cancelled, competition: future_competition2, user: registered_user)

        grouped_competitions, = registered_user.my_competitions

        expect(grouped_competitions[:future]).to eq [future_competition1, future_competition3]
        expect(grouped_competitions[:past]).to eq [past_competition1]
      end

      it 'shows upcoming competition they have a pending registration for' do
        create(:registration, :pending, competition: future_competition2, user: registered_user)

        grouped_competitions, = registered_user.my_competitions

        expect(grouped_competitions[:future]).to eq [future_competition1, future_competition2, future_competition3]
        expect(grouped_competitions[:past]).to eq [past_competition1]
      end

      it 'does not show past competitions they have a pending registration for' do
        create(:registration, :pending, competition: past_competition2, user: registered_user)

        grouped_competitions, = registered_user.my_competitions

        expect(grouped_competitions[:future]).to eq [future_competition1, future_competition3]
        expect(grouped_competitions[:past]).to eq [past_competition1]
      end

      it 'does not show past competitions with results uploaded they have an accepted registration but not results for' do
        create(:registration, :accepted, competition: past_competition4, user: registered_user)

        grouped_competitions, = registered_user.my_competitions

        expect(grouped_competitions[:future]).to eq [future_competition1, future_competition3]
        expect(grouped_competitions[:past]).to eq [past_competition1]
      end

      it 'shows upcoming competitions they have bookmarked' do
        BookmarkedCompetition.create(competition: future_competition2, user: registered_user)
        BookmarkedCompetition.create(competition: future_competition4, user: registered_user)

        grouped_competitions, = registered_user.my_competitions

        expect(grouped_competitions[:bookmarked]).to eq [future_competition4, future_competition2]
      end

      it 'does not show past competitions they have bookmarked' do
        BookmarkedCompetition.create(competition: past_competition1, user: registered_user)

        grouped_competitions, = registered_user.my_competitions

        expect(grouped_competitions[:bookmarked]).to eq []
      end

      it 'does not list cancelled competitions under the past section' do
        cancelled_competition = create(:competition, :cancelled, starts: 4.months.ago, delegates: [delegate], events: Event.where(id: %w[222 333]))
        create(:registration, :accepted, competition: cancelled_competition, user: registered_user)

        grouped_competitions, = registered_user.my_competitions

        expect(grouped_competitions[:past]).to eq [past_competition1]
      end
    end

    context 'for an organizer' do
      it 'shows my upcoming and past competitions' do
        grouped_competitions, = organizer.my_competitions

        expect(grouped_competitions[:future]).to eq [future_competition1, future_competition2, future_competition3]
        expect(grouped_competitions[:past]).to eq [past_competition1, past_competition3]
      end
    end

    context 'for a Delegate' do
      it 'shows my upcoming and past competitions' do
        grouped_competitions, = delegate.my_competitions

        expect(grouped_competitions[:future]).to eq [unscheduled_competition1, future_competition1, future_competition3]
        expect(grouped_competitions[:past]).to eq [past_competition2, past_competition3, past_competition4]
      end
    end
  end
end
