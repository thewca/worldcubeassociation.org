require 'rails_helper'

describe NodesController do
  before do
    # TODO - there *must* be a better way of doing this stuff using FactoryGirl
    @node = FactoryGirl.create(:node, created: 2.hours.ago.to_i)
    FactoryGirl.create(:field_data_body, body_value: @node.title.parameterize, entity_id: @node.nid)
    FactoryGirl.create(:url_alias, alias: "posts/#{@node.title.parameterize}", source: "node/#{@node.nid}")

    @sticky_node = FactoryGirl.create(:node, sticky: true, created: 3.hours.ago.to_i)
    FactoryGirl.create(:field_data_body, body_value: @sticky_node.title.parameterize, entity_id: @sticky_node.nid)
    FactoryGirl.create(:url_alias, alias: "posts/#{@sticky_node.title.parameterize}", source: "node/#{@sticky_node.nid}")
  end

  describe "GET #index" do
    it "populates an array of nodes with sticky nodes first" do
      get :index
      expect(assigns(:nodes)).to eq [ @sticky_node, @node ]
    end
  end

  describe "GET #rss" do
    it "populates an array of nodes ignoring sticky bit" do
      get :rss, format: :xml
      expect(assigns(:nodes)).to eq [ @node, @sticky_node ]
    end
  end

  describe "GET #show" do
    it "finds a node by alias" do
      get :show, post_alias: @node.alias
      expect(assigns(:node)).to eq @node
    end
  end
end
