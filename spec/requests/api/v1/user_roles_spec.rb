# frozen_string_literal: true

require "rails_helper"

RSpec.describe "API v1 User Roles" do
  describe "GET #active" do
    let!(:active_roles) { create_list(:translator_role, 2) }

    before { create(:user_role, :translators, :inactive) }

    it "is reachable without logging in" do
      get api_v1_active_user_roles_path(group_type: UserGroup.group_types[:translators])

      expect(response).to be_successful
    end

    it "returns only active roles" do
      get api_v1_active_user_roles_path(group_type: UserGroup.group_types[:translators])

      expect(response.parsed_body.pluck("id")).to match_array active_roles.map(&:id)
    end

    it "filters by group" do
      wrt_role = create(:user_role, :active, :wrt_member)

      get api_v1_active_user_roles_path(group_id: wrt_role.group_id)

      expect(response.parsed_body.pluck("id")).to eq [wrt_role.id]
    end
  end
end
