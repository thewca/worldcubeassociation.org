require 'rails_helper'

RSpec.describe User, type: :model do
  it "defines a valid user" do
    user = FactoryGirl.create :user
    expect(user).to be_valid
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

  it "validates WCA id" do
    user = FactoryGirl.build :user, wca_id: "2005FLEI01"
    expect(user).to be_valid

    user = FactoryGirl.build :user, wca_id: "2005FLE01"
    expect(user).to be_invalid

    user = FactoryGirl.build :user, wca_id: "200FLEI01"
    expect(user).to be_invalid

    user = FactoryGirl.build :user, wca_id: "200FLEI0"
    expect(user).to be_invalid
  end

  it "nullifies empty WCA ids" do
    user = FactoryGirl.create :user, wca_id: ""
    expect(user.wca_id).to be_nil

    # Verify that we can create multiple users with empty wca_ids
    user = FactoryGirl.create :user, wca_id: ""
    expect(user.wca_id).to be_nil
  end

  it "verifies WCA id unique when changeing WCA id" do
    user1 = FactoryGirl.create :user, wca_id: "2005FLEI01"
    user2 = FactoryGirl.create :user, wca_id: "2006FLEI01"
    user1.wca_id = user2.wca_id
    expect(user1).to be_invalid
    expect(user1.errors.messages[:wca_id]).to eq ["must be unique"]
  end

  it "can create user with empty password" do
    FactoryGirl.create :user, encrypted_password: ""
  end

  it "removes dummy accounts when WCA id is assigned" do
    dummy_user = FactoryGirl.create :user, wca_id: "2005FLEI01", encrypted_password: ""
    expect(dummy_user).to be_valid
    dummy_user.update_attributes!(
      avatar: File.open(Rails.root.join("spec/support/logo.jpg")),
      avatar_crop_x: 40,
      avatar_crop_y: 40,
      avatar_crop_w: 40,
      avatar_crop_h: 40,
    )
    avatar = dummy_user.reload.read_attribute(:avatar)
    expect(File).to exist("public/uploads/user/avatar/2005FLEI01/#{avatar}")

    user = FactoryGirl.create :user, wca_id: "2004FLEI01"
    expect(user).to be_valid
    user.wca_id = "2005FLEI01"
    user.save!

    # Check that the dummy account was deleted, and we inherited its avatar.
    expect(User.find_by_id(dummy_user.id)).to be_nil
    expect(user.reload.read_attribute :avatar).to eq avatar
    expect(File).to exist("public/uploads/user/avatar/2005FLEI01/#{avatar}")
  end

  it "does not allow duplicate WCA ids" do
    user = FactoryGirl.create :user, wca_id: "2005FLEI01"
    expect(user).to be_valid

    user = FactoryGirl.create :user
    expect(user).to be_valid
    user.wca_id = "2005FLEI01"
    expect(user).not_to be_valid
  end

  it "saves crop coordinates" do
    user = FactoryGirl.create :user, wca_id: "2005FLEI01"

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
    user = FactoryGirl.create :user, wca_id: "2005FLEI01"
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
    user = FactoryGirl.create :user, wca_id: "2005FLEI01"
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
end
