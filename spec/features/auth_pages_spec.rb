# frozen_string_literal: true

require "rails_helper"

RSpec.feature "Redesigned authentication pages" do
  let(:user) { create(:user) }

  it "offers the classic page from the redesigned one, keeping the query parameters" do
    visit "/users/sign_in?redirect_uri=https%3A%2F%2Fexample.com%2Fcallback"
    expect(page).to have_text "You are viewing the new sign in page"

    click_link "Switch to the old sign in page"
    expect(page).to have_current_path "/users/sign_in?classic=true&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback"
    expect(page).to have_no_text "You are viewing the new sign in page"
  end

  it "hides the navigation on the redesigned page but keeps it on the classic one" do
    visit "/users/sign_in"
    expect(page).to have_button "Sign in"
    expect(page).to have_no_css ".navbar"

    visit "/users/sign_in?classic=true"
    expect(page).to have_css ".navbar"
  end

  it "shows the OAuth authorization request in the redesigned shell" do
    oauth_application = create(:oauth_application)
    sign_in user

    visit "/oauth/authorize?client_id=#{oauth_application.uid}" \
          "&redirect_uri=#{CGI.escape(oauth_application.redirect_uri)}" \
          "&response_type=code&scope=public+email"

    expect(page).to have_text "Authorize samurai app to use your account?"
    expect(page).to have_text "Access your email address"
    expect(page).to have_button "Authorize"
    expect(page).to have_css ".auth-page"
    expect(page).to have_no_css ".navbar"
  end

  it "signs in from the classic page" do
    visit "/users/sign_in?classic=true"
    fill_in "Email", with: user.email
    fill_in "user[password]", with: "wca"
    click_button "Sign in"
    expect(page).to have_text "Signed in successfully"
  end

  it "stays on the classic page after a failed sign in" do
    visit "/users/sign_in?classic=true"
    fill_in "Email", with: user.email
    fill_in "user[password]", with: "definitely not the password"
    click_button "Sign in"
    expect(page).to have_text "Invalid email, WCA ID, or password."
    expect(page).to have_no_text "You are viewing the new sign in page"
  end

  it "stays on the redesigned page after a failed sign in" do
    visit "/users/sign_in"
    fill_in "Email", with: user.email
    fill_in "user[password]", with: "definitely not the password"
    click_button "Sign in"
    expect(page).to have_text "Invalid email, WCA ID, or password."
    expect(page).to have_text "You are viewing the new sign in page"
  end
end
