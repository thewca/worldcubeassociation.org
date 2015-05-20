Rails.application.routes.draw do
  use_doorkeeper
  # TODO - disable deleting of user accounts
  devise_for :devise_users, path: 'users'

  root 'nodes#index'
  # TODO - once we're ready to move away from the drupal schema, refactor this
  # using https://github.com/norman/friendly_id.
  get 'posts/:post_alias' => 'nodes#show', as: 'node'
  get 'rss' => 'nodes#rss'

  get 'robots' => 'static_pages#robots'

  get 'about' => 'static_pages#about'
  get 'delegates' => 'static_pages#delegates'
  get 'organisations' => 'static_pages#organisations'
  get 'contact' => 'static_pages#contact'
  get 'score-tools' => 'static_pages#score_tools'
  get 'logo' => 'static_pages#logo'
  get 'wca-workbook-assistant' => 'static_pages#wca_workbook_assistant'
  get 'wca-workbook-assistant-versions' => 'static_pages#wca_workbook_assistant_versions'

  get 'contact/wrc' => 'contacts#wrc'
  post 'contact/wrc' => 'contacts#wrc_create'

  get 'contact/website' => 'contacts#website'
  post 'contact/website' => 'contacts#website_create'

  # TODO - add api page
  ## API
  # See http://localhost:3000/oauth/applications/ (WcaOnRails/db/seeds.rb) to view
  # and create new test applications.

  # ```bash
  # > curl http://localhost:3000/oauth/token -X POST -F grant_type=password -F username=wca@worldcubeassociation.org -F password=wca`
  # {"access_token":"1d6c95446cab947224286b7bec4382d898c664c7a3cafb16d3d110a3044cf4dc","token_type":"bearer","expires_in":7200,"created_at":1430788134}
  # > curl -H "Authorization: Bearer 1d6c95446cab947224286b7bec4382d898c664c7a3cafb16d3d110a3044cf4dc" http://localhost:3000/api/v0/me
  # {"me":{"id":1,"email":"wca@worldcubeassociation.org","created_at":"2015-05-05T00:57:11.788Z","updated_at":"2015-05-05T00:57:12.072Z"}}
  # ```
  namespace :api do
    namespace :v0 do
      get '/me' => "api#me"
      get '/auth/results' => "api#auth_results"
      get '/scramble-program' => "api#scramble_program"
    end
  end

end
