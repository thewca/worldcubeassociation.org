# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReassignWcaId do
  let(:account1) { FactoryBot.create(:user_with_wca_id, :senior_delegate, country_iso2: "US") }
  let(:shared_attributes) { account1.attributes.symbolize_keys.slice(:name, :country_iso2, :gender, :dob) }
  let(:account2) { FactoryBot.create(:user, shared_attributes) }
  let(:reassign_wca_id) { ReassignWcaId.new(account1: account1, account2: account2) }

  it "is valid" do
    expect(reassign_wca_id).to be_valid
  end

  it "requires different people" do
    reassign_wca_id.account2 = reassign_wca_id.account1
    expect(reassign_wca_id).to be_invalid_with_errors(account2: ["Cannot transfer a WCA ID of an account with itself!", "Account 2 must not have a WCA ID assigned"])
  end

  it "requires account1 to have a wca id" do
    account3 = FactoryBot.create(:user, shared_attributes)
    reassign_wca_id.account1 = account3
    expect(reassign_wca_id).to be_invalid_with_errors(account1: ["Account 1 must have a WCA ID assigned"])
  end

  it "requires account2 to not have a wca id" do
    account3 = FactoryBot.create(:user_with_wca_id, shared_attributes)
    reassign_wca_id.account2 = account3
    expect(reassign_wca_id).to be_invalid_with_errors(account2: ["Account 2 must not have a WCA ID assigned"])
  end

  it "requires same name" do
    account2.update_attribute(:name, "Some other name")
    expect(reassign_wca_id).to be_invalid_with_errors(account2: ["Names don't match"])
  end

  it "requires same country" do
    account2.update_attribute(:country_iso2, "VE")
    expect(reassign_wca_id).to be_invalid_with_errors(account2: ["Countries don't match"])
  end

  it "requires same gender" do
    account2.update_attribute(:gender, { "m"=>"f", "f"=>"m" }[account1.gender])
    expect(reassign_wca_id).to be_invalid_with_errors(account2: ["Genders don't match"])
  end

  it "requires same dob" do
    account2.update_attribute(:dob, account1.dob + 1)
    expect(reassign_wca_id).to be_invalid_with_errors(account2: ["Birthdays don't match"])
  end

  it "can actually reassign wca id" do
    team_member = FactoryBot.create(:team_member, user_id: account1.id)
    organized_competition = FactoryBot.create(:competition, organizers: [account1])
    delegated_competition = FactoryBot.create(:competition, delegates: [account1])
    trainee_delegated_competition = FactoryBot.create(:competition, delegates: [account1])
    posted_competition = FactoryBot.create(:competition, :past, announced_by: account1.id, results_posted_by: account1.id)

    wca_id = account1.wca_id
    delegate_status = account1.delegate_status

    expect(reassign_wca_id.do_reassign_wca_id).to eq true
    expect(account1.reload.wca_id).to eq nil
    expect(account2.reload.wca_id).to eq wca_id
    expect(account1.reload.delegate_status).to eq nil
    expect(account2.reload.delegate_status).to eq delegate_status
    expect(team_member.reload.user_id).to eq account2.id
    expect(organized_competition.reload.organizers[0].id).to eq account2.id
    expect(delegated_competition.reload.delegates[0].id).to eq account2.id
    expect(trainee_delegated_competition.reload.trainee_delegates[0].id).to eq account2.id
    expect(posted_competition.reload.announced_by).to eq account2.id
    expect(posted_competition.reload.results_posted_by).to eq account2.id
  end
end
