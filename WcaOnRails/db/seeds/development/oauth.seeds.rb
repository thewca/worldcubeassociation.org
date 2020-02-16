# frozen_string_literal: true

after "development:users" do
  software_team_user = User.find_by_email!("wst_team@valid.domain")
  Doorkeeper::Application.create!(
    name: "test app",
    uid: "9ad911ea379bd6f49c4f923644dbea3f44aeab5625a25f468210026a862b0c3d",
    secret: "3b787d2f6c9e51d1f8c4f758e569517b37d281978812ffea304b965c9bd59720",
    redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
    owner: software_team_user,
  )
end
