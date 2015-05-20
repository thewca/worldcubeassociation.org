require 'rails_helper'

describe Node do
  it "has a valid factory" do
    expect(FactoryGirl.create :node).to be_valid
  end

  it "finds alias for posts with posts/ prefix in alias" do
    node = FactoryGirl.create :node
    FactoryGirl.create :url_alias, source: "node/#{node.id}", alias: "posts/foo"
    expect(node.alias).to eq "foo"
  end

  it "finds alias for posts without posts/ prefix in alias" do
    node = FactoryGirl.create :node
    FactoryGirl.create :url_alias, source: "node/#{node.id}", alias: "foo"
    expect(node.alias).to eq "foo"
  end
end
