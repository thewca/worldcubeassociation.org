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

  namespace :api do
    namespace :v0 do
      get '/me' => "api#me"
    end
  end

end
