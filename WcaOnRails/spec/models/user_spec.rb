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
  end

  it "requires senior delegate be a senior delegate" do
    delegate = FactoryGirl.create :delegate
    user = FactoryGirl.create :user

    delegate.senior_delegate = user
    expect(delegate).to be_invalid

    user.senior_delegate!
    expect(delegate).to be_valid
  end

  describe "team leaders" do
    it "results team" do
      user = FactoryGirl.build :user, results_team: false, results_team_leader: true
      expect(user).not_to be_valid
    end
    it "wdc team" do
      user = FactoryGirl.build :user, wdc_team: false, wdc_team_leader: true
      expect(user).not_to be_valid
    end
    it "wrc team" do
      user = FactoryGirl.build :user, wrc_team: false, wrc_team_leader: true
      expect(user).not_to be_valid
    end
    it "wca website team" do
      user = FactoryGirl.build :user, wca_website_team: false, wca_website_team_leader: true
      expect(user).not_to be_valid
    end
    it "software admin team" do
      user = FactoryGirl.build :user, software_admin_team: false, software_admin_team_leader: true
      expect(user).not_to be_valid
    end
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
    let(:person) { FactoryGirl.create :person }
    let(:delegate) { FactoryGirl.create :delegate }
    let(:user) { FactoryGirl.create :user, unconfirmed_wca_id: person.id, delegate_id_to_handle_wca_id_claim: delegate.id }
    let(:user_with_wca_id) { FactoryGirl.create :user_with_wca_id }

    it "defines a valid user" do
      expect(user).to be_valid
    end

    it "requires unconfirmed_wca_id" do
      user.claiming_wca_id = true
      user.unconfirmed_wca_id = nil
      expect(user).to be_invalid
    end

    it "requires delegate_id_to_handle_wca_id_claim" do
      user.claiming_wca_id = true
      user.delegate_id_to_handle_wca_id_claim = nil
      expect(user).to be_invalid
    end

    it "delegate_id_to_handle_wca_id_claim must be a delegate" do
      user.claiming_wca_id = true
      user.delegate_id_to_handle_wca_id_claim = user.id
      expect(user).to be_invalid
    end

    it "must claim a real wca id" do
      user.claiming_wca_id = true
      user.unconfirmed_wca_id = "1982AAAA01"
      expect(user).to be_invalid

      user.unconfirmed_wca_id = person.wca_id
      expect(user).to be_valid
    end

    it "cannot claim a wca id already assigned to a real user" do
      user.claiming_wca_id = true
      user.unconfirmed_wca_id = user_with_wca_id.wca_id
      expect(user).to be_invalid
    end

    it "can claim a wca id already assigned to a dummy user" do
      dummy_user = FactoryGirl.create :dummy_user

      user.claiming_wca_id = true
      user.unconfirmed_wca_id = dummy_user.wca_id
      expect(user).to be_valid
    end

    it "can match a wca id already claimed by a user" do
      user.claiming_wca_id = true
      user2 = FactoryGirl.create :user
      user2.delegate_id_to_handle_wca_id_claim = delegate.id

      user2.unconfirmed_wca_id = person.wca_id
      user.unconfirmed_wca_id = person.wca_id

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
end
