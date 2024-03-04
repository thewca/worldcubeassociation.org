# frozen_string_literal: true

FactoryBot.define do
  factory :oauth_application, class: Doorkeeper::Application do |f|
    f.name { "samurai app" }
    f.uid { "9ad911ea379bd6f49c4f923644dbea3f44aeab5625a25f468210026a862b0c3d" }
    f.secret { "3b787d2f6c9e51d1f8c4f758e569517b37d281978812ffea304b965c9bd59720" }
    f.redirect_uri { "urn:ietf:wg:oauth:2.0:oob" }
    f.scopes { "public dob email" }
  end
end
