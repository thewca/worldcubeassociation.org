require "rails_helper"

describe "users" do
  include Capybara::DSL

  it 'can change password' do
    user = FactoryGirl.create(:user)

    # sign in
    post_via_redirect user_session_path, 'user[email]' => user.email, 'user[password]' => user.password
    get edit_user_registration_path
    expect(response).to be_success

    new_password = 'new_password'
    put_via_redirect user_registration_path, 'user[email]' => user.email, 'user[password]' => new_password, 'user[password_confirmation]' => new_password, 'user[current_password]' => user.password
    expect(response).to be_success

    # sign out
    delete destroy_user_session_path
    get edit_user_registration_path
    expect(response).to redirect_to new_user_session_path

    # sign in with new password
    post_via_redirect user_session_path, 'user[email]' => user.email, 'user[password]' => new_password
    get edit_user_registration_path
    expect(response).to be_success
  end
end
