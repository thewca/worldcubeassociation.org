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
  get 'profile/edit' => 'users#edit'

  get 'profile/claim_wca_id' => 'users#claim_wca_id'
  patch 'profile/claim_wca_id' => 'users#do_claim_wca_id'
  get 'profile/claim_wca_id/select_nearby_delegate' => 'users#select_nearby_delegate'

  get 'users/:id/edit/avatar_thumbnail' => 'users#edit_avatar_thumbnail', as: :users_avatar_thumbnail_edit
  get 'users/:id/edit/pending_avatar_thumbnail' => 'users#edit_pending_avatar_thumbnail', as: :users_pending_avatar_thumbnail_edit
  get 'admin/avatars' => 'admin/avatars#index'
  post 'admin/avatars' => 'admin/avatars#update_all'

  resources :competitions, only: [:index, :edit, :update, :new, :create] do
    patch 'registrations/all' => 'registrations#update_all', as: :registrations_update_all
    resources :registrations, only: [:index, :update, :create, :edit], shallow: true
    get 'register' => 'registrations#register'
  end
  get 'competitions/:id/edit/admin' => 'competitions#admin_edit', as: :admin_edit_competition
  get 'competitions/:id/edit/nearby_competitions' => 'competitions#nearby_competitions', as: :nearby_competitions
  get 'competitions/:id/edit/time_until_competition' => 'competitions#time_until_competition', as: :time_until_competition

  resources :polls, only: [:edit, :new, :vote, :create, :update, :index, :destroy]
  get 'polls/:id/vote' => 'votes#vote', as: 'polls_vote'
  get 'polls/:id/results' => 'polls#results', as: 'polls_results'

  resources :votes, only: [:create, :update]

  # TODO - these are vulnerable to CSRF. We should be able to change these to
  # POSTs once check_comp_data.php has been ported to Rails.
  # See https://github.com/cubing/worldcubeassociation.org/issues/161
  get 'competitions/:id/post/announcement' => 'competitions#post_announcement', as: :competition_post_announcement
  get 'competitions/:id/post/results' => 'competitions#post_results', as: :competition_post_results

  get 'delegate' => 'delegates_panel#index'
  get 'delegate/crash-course' => 'delegates_panel#crash_course'
  get 'delegate/crash-course/edit' => 'delegates_panel#edit_crash_course'
  patch 'delegate/crash-course' => 'delegates_panel#update_crash_course'
  resources :notifications, only: [:index]

  root 'posts#index'
  resources :posts
  get 'rss' => 'posts#rss'

  get 'robots' => 'static_pages#robots'

  get 'about' => 'static_pages#about'
  get 'delegates' => 'static_pages#delegates'
  get 'organisations' => 'static_pages#organisations'
  get 'contact' => 'static_pages#contact'
  get 'faq' => 'static_pages#faq'
  get 'score-tools' => 'static_pages#score_tools'
  get 'logo' => 'static_pages#logo'
  get 'wca-workbook-assistant' => 'static_pages#wca_workbook_assistant'
  get 'wca-workbook-assistant-versions' => 'static_pages#wca_workbook_assistant_versions'

  get 'contact/wrc' => 'contacts#wrc'
  post 'contact/wrc' => 'contacts#wrc_create'

  get 'contact/website' => 'contacts#website'
  post 'contact/website' => 'contacts#website_create'

  get "/regulations" => 'regulations#show', id: "index"
  get "/regulations/*id" => 'regulations#show'

  get "/admin" => 'admin#index'
  get "/admin/merge_people" => 'admin#merge_people'
  post "/admin/merge_people" => 'admin#do_merge_people'

  get "/search" => 'search_results#index'

  namespace :api do
    get '/', to: redirect('/api/v0')
    namespace :v0 do
      get '/' => "api#help"
      get '/me' => "api#me"
      get '/auth/results' => "api#auth_results"
      get '/scramble-program' => "api#scramble_program"
      get '/search' => 'api#omni_search'
      get '/search/posts' => 'api#posts_search'
      get '/search/competitions' => 'api#competitions_search'
      get '/search/users' => 'api#users_search'
      get '/users/:id' => 'api#show_user_by_id', constraints: { id: /\d+/ }
      get '/users/:wca_id' => 'api#show_user_by_wca_id'
      resources :competitions, only: [:show]
    end
  end
end
