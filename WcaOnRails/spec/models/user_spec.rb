require 'rails_helper'

RSpec.describe User, type: :model do
  it "defines a valid user" do
    user = FactoryGirl.create :user
    expect(user).to be_valid
  end

  it "requires senior delegate be a senior delegate" do
    user1 = FactoryGirl.create :user
    user1.delegate_status = "delegate"
    user2 = FactoryGirl.create :user

    user1.senior_delegate = user2
    expect(user1).to be_invalid

    user2.senior_delegate!
    expect(user1).to be_valid
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
end
