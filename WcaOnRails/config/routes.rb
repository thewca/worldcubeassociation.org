Rails.application.routes.draw do
  use_doorkeeper
  # TODO - disable deleting of user accounts
  devise_for :users, path: 'users'
  resources :users, path: "users", only: [:index, :edit, :update]

  root 'posts#index'
  resources :posts
  get 'rss' => 'posts#rss'

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
    get '/', to: redirect('/api/v0')
    namespace :v0 do
      get '/' => "api#help"
      get '/me' => "api#me"
      get '/auth/results' => "api#auth_results"
      get '/scramble-program' => "api#scramble_program"
    end
  end
end
