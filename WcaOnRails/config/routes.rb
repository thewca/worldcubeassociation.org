Rails.application.routes.draw do
  use_doorkeeper do
    controllers applications: 'oauth/applications'
  end

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
  get 'profile/claim_wca_id/select_nearby_delegate' => 'users#select_nearby_delegate'

  get 'users/:id/edit/avatar_thumbnail' => 'users#edit_avatar_thumbnail', as: :users_avatar_thumbnail_edit
  get 'users/:id/edit/pending_avatar_thumbnail' => 'users#edit_pending_avatar_thumbnail', as: :users_pending_avatar_thumbnail_edit
  get 'admin/avatars' => 'admin/avatars#index'
  post 'admin/avatars' => 'admin/avatars#update_all'

  get 'competitions/mine' => 'competitions#my_competitions', as: :my_comps
  resources :competitions, only: [:index, :show, :edit, :update, :new, :create] do
    get 'results/podiums' => 'competitions#show_podiums'
    get 'results/all' => 'competitions#show_all_results'
    get 'results/by_person' => 'competitions#show_results_by_person'

    patch 'registrations/selected' => 'registrations#do_actions_for_selected', as: :registrations_do_actions_for_selected
    post 'registrations/export' => 'registrations#export', as: :registrations_export
    get 'registrations/psych-sheet' => 'registrations#psych_sheet', as: :psych_sheet
    get 'registrations/psych-sheet/:event_id' => 'registrations#psych_sheet_event', as: :psych_sheet_event
    resources :registrations, only: [:index, :update, :create, :edit, :destroy], shallow: true
    get 'edit/registrations' => 'registrations#edit_registrations'
    get 'register' => 'registrations#register'
    get 'register-require-sign-in' => 'registrations#register_require_sign_in'
  end
  get 'competitions/:id/edit/admin' => 'competitions#admin_edit', as: :admin_edit_competition
  get 'competitions/edit/nearby_competitions' => 'competitions#nearby_competitions', as: :nearby_competitions
  get 'competitions/edit/time_until_competition' => 'competitions#time_until_competition', as: :time_until_competition
  get 'competitions/:id/edit/clone_competition' => 'competitions#clone_competition', as: :clone_competition

  resources :polls, only: [:edit, :new, :vote, :create, :update, :index, :destroy]
  get 'polls/:id/vote' => 'votes#vote', as: 'polls_vote'
  get 'polls/:id/results' => 'polls#results', as: 'polls_results'

  resources :teams, only: [:index, :new, :create, :update, :edit]

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

  get 'contact/website' => 'contacts#website'
  post 'contact/website' => 'contacts#website_create'

  get '/regulations' => 'regulations#show', id: 'index'
  get '/regulations/*id' => 'regulations#show'

  get '/admin' => 'admin#index'
  get '/admin/merge_people' => 'admin#merge_people'
  post '/admin/merge_people' => 'admin#do_merge_people'
  get '/admin/edit_person' => 'admin#edit_person'
  patch '/admin/update_person' => 'admin#update_person'
  get '/admin/person_data' => 'admin#person_data'

  get '/search' => 'search_results#index'

  namespace :api do
    get '/', to: redirect('/api/v0')
    namespace :v0 do
      get '/' => 'api#help'
      get '/me' => 'api#me'
      get '/auth/results' => 'api#auth_results'
      get '/scramble-program' => 'api#scramble_program'
      get '/search' => 'api#omni_search'
      get '/search/posts' => 'api#posts_search'
      get '/search/competitions' => 'api#competitions_search'
      get '/search/users' => 'api#users_search'
      get '/users/:id' => 'api#show_user_by_id', constraints: { id: /\d+/ }
      get '/users/:wca_id' => 'api#show_user_by_wca_id'
      get '/competitions' => 'api#competitions'
      resources :competitions, only: [:show]
    end
  end
end
