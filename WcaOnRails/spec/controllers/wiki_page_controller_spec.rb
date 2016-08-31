require 'rails_helper'

def does_not_have_access_and(expect_to_be_redirected_somewhere)
  let(:wiki_page) { FactoryGirl.create :wiki_page, title: "Title" }

  describe "GET #new" do
    before { get :new }
    send expect_to_be_redirected_somewhere
  end

  describe "POST #create" do
    before { post :create, wiki_page: { title: "Title" } }
    send expect_to_be_redirected_somewhere
  end

  describe "GET #index" do
    before { get :index }
    send expect_to_be_redirected_somewhere
  end

  describe "GET #show" do
    before { get :show, id: wiki_page }
    send expect_to_be_redirected_somewhere
  end

  describe "GET #edit" do
    before { get :edit, id: wiki_page }
    send expect_to_be_redirected_somewhere
  end

  describe "PATCH #update" do
    before { patch :update, id: wiki_page, wiki_page: { title: "New Title" } }
    send expect_to_be_redirected_somewhere

    it "does not change the wiki page" do
      expect(wiki_page.title).to eq "Title"
    end
  end

  describe "DELETE #destroy" do
    before { delete :destroy, id: wiki_page }
    send expect_to_be_redirected_somewhere

    it "does not delete the wiki page" do
      expect(WikiPage.exists?(wiki_page.id)).to eq true
    end
  end
end

RSpec.describe WikiPagesController, type: :controller do
  context "when not signed in" do
    does_not_have_access_and "redirects_to_sign_in_page"
  end

  context "when signed in as normal user" do
    sign_in { FactoryGirl.create :user }
    does_not_have_access_and "redirects_to_root_url"
  end

  context "when signed in as member of team other than results one" do
    sign_in { FactoryGirl.create :wrc_team }
    does_not_have_access_and "redirects_to_root_url"
  end

  context "when signed in as results team member" do
    let(:results_team_member) { FactoryGirl.create :results_team }
    let(:wiki_page) { FactoryGirl.create :wiki_page, title: "Title" }

    before do
      sign_in results_team_member
    end

    describe "GET #new" do
      before do
        get :new
      end

      it { is_expected.to render_template :new }

      it "assigns new wiki page with appropriate author" do
        expect(assigns(:wiki_page).author).to eq results_team_member
      end
    end

    describe "POST #create" do
      it "creates a new page" do
        expect do
          post :create, wiki_page: { title: "Title", content: "Page body." }
        end.to change { results_team_member.wiki_pages.count }.by 1
      end

      it "sets successful flash message" do
        post :create, wiki_page: { title: "Title", content: "Page body." }
        expect(flash[:success]).to_not be_empty
      end
    end

    describe "GET #index" do
      before { get :index }
      it { is_expected.to render_template :index }
    end

    describe "GET #show" do
      before { get :show, id: wiki_page }
      it { is_expected.to render_template :show }
    end

    describe "GET #edit" do
      before { get :edit, id: wiki_page }

      it { is_expected.to render_template :edit }

      it "assigns the appropriate wiki page" do
        expect(assigns(:wiki_page)).to eq wiki_page
      end
    end

    describe "PATCH #update" do
      before { patch :update, id: wiki_page, wiki_page: { title: "New Title" } }

      it "updates the wiki post correctly" do
        expect(wiki_page.reload.title).to eq "New Title"
      end

      it "sets successful flash message" do
        expect(flash[:success]).to_not be_empty
      end
    end

    describe "DELETE #destroy" do
      before { delete :destroy, id: wiki_page }

      it { is_expected.to redirect_to wiki_pages_url }

      it "deletes the wiki page" do
        expect(WikiPage.exists?(wiki_page.id)).to eq false
      end

      it "sets successful message" do
        expect(flash[:success]).to_not be_empty
      end
    end
  end
end
