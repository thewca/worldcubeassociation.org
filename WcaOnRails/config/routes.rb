Rails.application.routes.draw do
  use_doorkeeper

  # Prevent account deletion.
  #  https://github.com/plataformatec/devise/wiki/How-To:-Disable-user-from-destroying-their-account
  devise_for :users, skip: :registrations
  devise_scope :user do
    resource :registration,
      only: [:new, :create],
      path: 'users',
      path_names: { new: 'sign_up' },
      controller: 'accounts/registrations',
      as: :user_registration do
        get :cancel
      end
  end
  resources :users, only: [:index, :edit, :update]
  get 'users/edit' => 'users#edit'

  resources :competitions, only: [:index, :edit, :update, :new, :create] do
    patch 'registrations/all' => 'registrations#update_all', as: :registrations_update_all
    resources :registrations, only: [:index, :update] do
    end
  end
  get 'competitions/:id/edit/admin' => 'competitions#admin_edit', as: :admin_edit_competition

  # TODO - these are vulnerable to CSRF. We should be able to change these to
  # POSTs once check_comp_data.php has been ported to Rails.
  # See https://github.com/cubing/worldcubeassociation.org/issues/161
  get 'competitions/:id/post/announcement' => 'competitions#post_announcement', as: :competition_post_announcement
  get 'competitions/:id/post/results' => 'competitions#post_results', as: :competition_post_results

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

  get "/regulations" => 'pages#show', id: "index"
  get "/regulations/*id" => 'pages#show'

  namespace :api do
    get '/', to: redirect('/api/v0')
    namespace :v0 do
      get '/' => "api#help"
      get '/me' => "api#me"
      get '/auth/results' => "api#auth_results"
      get '/scramble-program' => "api#scramble_program"
      get '/users/search/:query' => 'api#users_search'
      get '/users/delegates/search/:query' => 'api#users_delegates_search'
    end
  end
end
