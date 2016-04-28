require 'rails_helper'

RSpec.describe User, type: :model do
  it "defines a valid user" do
    user = FactoryGirl.create :user
    expect(user).to be_valid
  end

  it "defines a dummy user" do
    user = FactoryGirl.create :dummy_user
    expect(user).to be_valid
    expect(user.dummy_account?).to be true
    users = User.search("")
    expect(users.count).to eq 0
  end

  it "search can find people who never logged in, but aren't dummy accounts" do
    user = FactoryGirl.create :user, encrypted_password: ""
    expect(user.dummy_account?).to be false
    users = User.search("")
    expect(users.count).to eq 1
    expect(users.first).to eq user
  end

  it "allows empty country" do
    user = FactoryGirl.build :user, country_iso2: ""
    expect(user).to be_valid

    user = FactoryGirl.build :user, country_iso2: nil
    expect(user).to be_valid
  end

  it "can confirm a user who has never competed before" do
    user = FactoryGirl.build :user, unconfirmed_wca_id: ""
    user.confirm!
  end

  it "doesn't allow demotion of a senior delegate with subordinate delegates" do
    delegate = FactoryGirl.create :delegate
    senior_delegate = FactoryGirl.create :senior_delegate

    delegate.senior_delegate = senior_delegate
    delegate.save!

    senior_delegate.delegate_status = ""
    expect(senior_delegate.save).to eq false
    expect(senior_delegate.errors.messages[:delegate_status]).to eq ["cannot demote senior delegate with subordinate delegates"]
  end

  it "allows demotion of a senior delegate with no subordinate delegates" do
    senior_delegate = FactoryGirl.create :senior_delegate

    senior_delegate.delegate_status = ""
    expect(senior_delegate.save).to eq true
    expect(senior_delegate.reload.delegate_status).to eq nil
  end

  it "requires senior delegate be a senior delegate" do
    delegate = FactoryGirl.create :delegate
    user = FactoryGirl.create :user

    delegate.senior_delegate = user
    expect(delegate).to be_invalid

    user.senior_delegate!
    expect(delegate).to be_valid
  end

  it "doesn't delete a real account when a dummy account's WCA ID is cleared" do
    # Create someone without a password and without a WCA ID. This simulates the kind
    # of accounts we originally created for all delegates without accounts.
    delegate = FactoryGirl.create(:delegate, encrypted_password: "", wca_id: nil)

    dummy_user = FactoryGirl.create :dummy_user
    dummy_user.wca_id = nil
    dummy_user.save!
    expect(User.find(delegate.id)).to eq delegate
  end

  it "does not give delegates results admin privileges" do
    delegate = FactoryGirl.create :delegate
    expect(delegate.can_admin_results?).to be false
  end

  it "does not allow senior delegate if senior delegate" do
    senior_delegate1 = FactoryGirl.create :user
    senior_delegate1.senior_delegate!

    senior_delegate2 = FactoryGirl.create :user
    senior_delegate2.senior_delegate!

    expect(senior_delegate1).to be_valid
    senior_delegate1.senior_delegate = senior_delegate2
    expect(senior_delegate1).to be_invalid
  end

  it "does not allow senior delegate if board member" do
    board_member = FactoryGirl.create :user
    board_member.board_member!

    senior_delegate = FactoryGirl.create :user
    senior_delegate.senior_delegate!

    expect(board_member).to be_valid
    board_member.senior_delegate = senior_delegate
    expect(board_member).to be_invalid
  end

  it "does not allow senior delegate if regular user" do
    user = FactoryGirl.create :user

    senior_delegate = FactoryGirl.create :user
    senior_delegate.senior_delegate!

    expect(user).to be_valid
    user.senior_delegate = senior_delegate
    expect(user).to be_invalid
  end

  describe "WCA ID" do
    let(:user) { FactoryGirl.create :user_with_wca_id }

    it "validates WCA ID" do
      user = FactoryGirl.build :user, wca_id: "2005FLEI02"
      expect(user).not_to be_valid

      user = FactoryGirl.build :user, wca_id: "2005FLE01"
      expect(user).to be_invalid

      user = FactoryGirl.build :user, wca_id: "200FLEI01"
      expect(user).to be_invalid

      user = FactoryGirl.build :user, wca_id: "200FLEI0"
      expect(user).to be_invalid
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

    it "nullifies empty WCA IDs" do
      # Verify that we can create multiple users with empty wca_ids
      user2 = FactoryGirl.create :user, wca_id: ""
      expect(user2.wca_id).to be_nil

      user.wca_id = ""
      user.save!
      expect(user.wca_id).to be_nil
    end

    it "verifies WCA ID unique when changing WCA ID" do
      person2 = FactoryGirl.create :person, id: "2006FLEI01"
      user2 = FactoryGirl.create :user, wca_id: "2006FLEI01", name: person2.name
      user.wca_id = user2.wca_id
      expect(user).to be_invalid
      expect(user.errors.messages[:wca_id]).to eq ["must be unique"]
    end

    it "removes dummy accounts and copies name when WCA ID is assigned" do
      dummy_user = FactoryGirl.create :dummy_user
      person_for_dummy = dummy_user.person
      expect(dummy_user).to be_valid
      dummy_user.update_attributes!(
        avatar: File.open(Rails.root.join("spec/support/logo.jpg")),
        avatar_crop_x: 40,
        avatar_crop_y: 40,
        avatar_crop_w: 40,
        avatar_crop_h: 40,
      )
      avatar = dummy_user.reload.read_attribute(:avatar)
      expect(File).to exist("public/uploads/user/avatar/#{dummy_user.wca_id}/#{avatar}")

      # Assigning a WCA ID to user should copy over the name from the Persons table.
      expect(user.name).to eq user.person.name
      user.wca_id = dummy_user.wca_id
      user.save!
      expect(user.name).to eq person_for_dummy.name

      # Check that the dummy account was deleted, and we inherited its avatar.
      expect(User.find_by_id(dummy_user.id)).to be_nil
      expect(user.reload.read_attribute :avatar).to eq avatar
      expect(File).to exist("public/uploads/user/avatar/#{dummy_user.wca_id}/#{avatar}")
    end

    it "does not allow duplicate WCA IDs" do
      user2 = FactoryGirl.create :user
      expect(user2).to be_valid
      user2.wca_id = user.wca_id
      expect(user2).not_to be_valid
    end
  end

  it "can create user with empty password" do
    FactoryGirl.create :user, encrypted_password: ""
  end

  it "saves crop coordinates" do
    user = FactoryGirl.create :user_with_wca_id

    user.update_attributes!(
      pending_avatar: File.open(Rails.root.join("spec/support/logo.jpg")),
    )
    expect(user.read_attribute :pending_avatar).not_to be_nil

    user.update_attributes!(
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
    user = FactoryGirl.create :user
    user.avatar = nil
    user.saved_avatar_crop_x = 40
    user.saved_avatar_crop_y = 40
    user.saved_avatar_crop_w = 40
    user.saved_avatar_crop_h = 40
    user.save!
  end

  it "clearing avatar clears cropping area" do
    user = FactoryGirl.create :user_with_wca_id
    user.update_attributes!(
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
    expect(user.read_attribute :avatar).to be_nil
    expect(user.read_attribute :pending_avatar).to be_nil
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
    user = FactoryGirl.create :user_with_wca_id
    user.update_attributes!(
      pending_avatar: File.open(Rails.root.join("spec/support/logo.jpg")),
      pending_avatar_crop_x: 40,
      pending_avatar_crop_y: 50,
      pending_avatar_crop_w: 60,
      pending_avatar_crop_h: 70,
    )
    user.approve_pending_avatar!
    expect(user.read_attribute :avatar).not_to be_nil
    expect(user.saved_avatar_crop_x).to eq 40
    expect(user.saved_avatar_crop_y).to eq 50
    expect(user.saved_avatar_crop_w).to eq 60
    expect(user.saved_avatar_crop_h).to eq 70

    expect(user.read_attribute :pending_avatar).to be_nil
    expect(user.saved_pending_avatar_crop_x).to eq nil
    expect(user.saved_pending_avatar_crop_y).to eq nil
    expect(user.saved_pending_avatar_crop_w).to eq nil
    expect(user.saved_pending_avatar_crop_h).to eq nil
  end

  describe "#delegated_competitions" do
    let(:delegate) { FactoryGirl.create :delegate }
    let(:other_delegate) { FactoryGirl.create :delegate }
    let!(:confirmed_competition1) { FactoryGirl.create :competition, delegates: [delegate] }
    let!(:confirmed_competition2) { FactoryGirl.create :competition, delegates: [delegate] }
    let!(:unconfirmed_competition1) { FactoryGirl.create :competition, delegates: [delegate] }
    let!(:unconfirmed_competition2) { FactoryGirl.create :competition, delegates: [delegate] }
    let!(:other_delegate_unconfirmed_competition) { FactoryGirl.create :competition, delegates: [other_delegate] }

    it "sees delegated competitions" do
      expect(delegate.delegated_competitions).to eq [
        confirmed_competition1,
        confirmed_competition2,
        unconfirmed_competition1,
        unconfirmed_competition2,
      ]
    end
  end

  describe "#organized_competitions" do
    let(:user) { FactoryGirl.create :user }
    let(:competition) { FactoryGirl.create :competition, organizers: [user] }

    it "sees organized competitions" do
      expect(user.organized_competitions).to eq [competition]
    end
  end

  describe "unconfirmed_wca_id" do
    let(:person) { FactoryGirl.create :person, year: 1990, month: 01, day: 02 }
    let(:delegate) { FactoryGirl.create :delegate }
    let(:user) { FactoryGirl.create :user, unconfirmed_wca_id: person.id, delegate_id_to_handle_wca_id_claim: delegate.id, claiming_wca_id: true, dob_verification: "1990-01-2" }

    let(:person_without_dob) { FactoryGirl.create :person, year: 0, month: 0, day: 0 }
    let(:user_with_wca_id) { FactoryGirl.create :user_with_wca_id }

    it "defines a valid user" do
      expect(user).to be_valid
    end

    it "requires unconfirmed_wca_id" do
      user.unconfirmed_wca_id = nil
      expect(user).to be_invalid
    end

    it "requires dob verification" do
      user.dob_verification = nil
      expect(user).to be_invalid
      expect(user.errors.messages[:dob_verification]).to eq ['incorrect']
    end

    it "does not allow claiming wca id Person without dob" do
      user.unconfirmed_wca_id = person_without_dob.wca_id
      user.dob_verification = "1234-04-03"
      expect(user).to be_invalid
      expect(user.errors.messages[:dob_verification]).to eq ["WCA ID does not have a birthdate. Contact the Results team to resolve this."]
    end

    it "does not show a message about incorrect dob for people who have already claimed their wca id" do
      user.unconfirmed_wca_id = user_with_wca_id.wca_id
      expect(user).to be_invalid
      expect(user.errors.messages[:unconfirmed_wca_id]).to eq ["already assigned to a different user"]
      expect(user.errors.messages[:dob_verification]).to eq nil
    end

    it "requires correct dob verification" do
      user.dob_verification = '2016-01-02'
      expect(user).to be_invalid
      expect(user.errors.messages[:dob_verification]).to eq ['incorrect']
    end

    it "requires delegate_id_to_handle_wca_id_claim" do
      user.delegate_id_to_handle_wca_id_claim = nil
      expect(user).to be_invalid
    end

    it "delegate_id_to_handle_wca_id_claim must be a delegate" do
      user.delegate_id_to_handle_wca_id_claim = user.id
      expect(user).to be_invalid
    end

    it "must claim a real wca id" do
      user.unconfirmed_wca_id = "1982AAAA01"
      expect(user).to be_invalid

      user.unconfirmed_wca_id = person.wca_id
      expect(user).to be_valid
    end

    it "cannot claim a wca id already assigned to a real user" do
      user.unconfirmed_wca_id = user_with_wca_id.wca_id
      expect(user).to be_invalid
    end

    it "can claim a wca id already assigned to a dummy user" do
      dummy_user = FactoryGirl.create :dummy_user

      user.unconfirmed_wca_id = dummy_user.wca_id
      user.dob_verification = dummy_user.person.dob.strftime("%F")
      expect(user).to be_valid
    end

    it "can match a wca id already claimed by a user" do
      user2 = FactoryGirl.create :user
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
      user_with_wca_id.unconfirmed_wca_id = person.id
      user_with_wca_id.delegate_id_to_handle_wca_id_claim = delegate.id
      expect(user_with_wca_id).to be_invalid
      expect(user_with_wca_id.errors.messages[:unconfirmed_wca_id]).to eq [
        "cannot claim a WCA ID because you already have WCA ID #{user_with_wca_id.wca_id}",
      ]
    end
  end

  it "#teams and #current_teams return unique team names" do
    wrc_team = Team.find_by_friendly_id('wrc')
    results_team = Team.find_by_friendly_id('results')
    user = FactoryGirl.create(:user)

    FactoryGirl.create(:team_member, team_id: wrc_team.id, user_id: user.id, start_date: Date.today - 20, end_date: Date.today - 10)
    FactoryGirl.create(:team_member, team_id: results_team.id, user_id: user.id, start_date: Date.today - 5, end_date: Date.today + 5)
    FactoryGirl.create(:team_member, team_id: results_team.id, user_id: user.id, start_date: Date.today + 6, end_date: Date.today + 10)

    expect(user.teams).to match_array [wrc_team, results_team]
    expect(user.current_teams).to match_array [results_team]
  end

  it 'former members of the results team are not considered current members' do
    member = FactoryGirl.create :results_team
    team_member = member.team_members.first
    team_member.update_attributes!(end_date: 1.day.ago)

    expect(member.reload.team_member?('results')).to eq false
  end

  it 'former leaders of the results team are not considered current leaders' do
    leader = FactoryGirl.create :results_team
    team_member = leader.team_members.first
    team_member.update_attributes!(team_leader: true)
    team_member.update_attributes!(end_date: 1.day.ago)

    expect(leader.reload.team_leader?('results')).to eq false

    expect(leader.teams_where_is_leader.count).to eq 0
  end
end
