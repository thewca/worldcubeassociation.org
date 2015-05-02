require 'rails_helper'

describe NodesController do
  before do
    fdb = FactoryGirl.create :field_data_body
    @node = fdb.node
    FactoryGirl.create(:url_alias, alias: "posts/#{@node.title.parameterize}", source: "node/#{@node.nid}")

    fdb = FactoryGirl.create :field_data_body
    @sticky_node = fdb.node
    @sticky_node.update!(sticky: true)
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
