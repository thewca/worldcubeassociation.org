# frozen_string_literal: true

require 'sidekiq/web'
require 'sidekiq/cron/web'

Rails.application.routes.draw do
  use_doorkeeper do
    controllers applications: 'oauth/applications'
  end

  # Starburst announcements, see https://github.com/starburstgem/starburst#installation
  mount Starburst::Engine => '/starburst'

  # Sidekiq web UI, see https://github.com/sidekiq/sidekiq/wiki/Devise
  # Specifically referring to results because WRT needs access to this on top of regular admins.
  authenticate :user, ->(user) { user.can_admin_results? } do
    mount Sidekiq::Web => '/sidekiq'
  end

  # Prevent account deletion, and overrides the sessions controller for 2FA.
  #  https://github.com/plataformatec/devise/wiki/How-To:-Disable-user-from-destroying-their-account
  devise_for :users, skip: :registrations, controllers: { sessions: "sessions" }
  devise_scope :user do
    resource :registration,
             only: [:new, :create],
             path: 'users',
             path_names: { new: 'sign_up' },
             controller: 'accounts/registrations',
             as: :user_registration do
               get :cancel
             end
    post 'users/generate-email-otp' => 'sessions#generate_email_otp'
    post 'users/authenticate-sensitive' => 'users#authenticate_user_for_sensitive_edit'
    delete 'users/sign-out-other' => 'sessions#destroy_other', as: :destroy_other_user_sessions
  end
  post 'registration/:id/refund/:payment_id' => 'registrations#refund_payment', as: :registration_payment_refund
  post 'registration/:id/load-payment-intent' => 'registrations#load_payment_intent', as: :registration_payment_intent
  get 'registration/:id/payment-completion' => 'registrations#payment_completion', as: :registration_payment_completion
  post 'registration/stripe-webhook' => 'registrations#stripe_webhook', as: :registration_stripe_webhook
  get 'registration/stripe-denomination' => 'registrations#stripe_denomination', as: :registration_stripe_denomination
  resources :users, only: [:index, :edit, :update]
  get 'profile/edit' => 'users#edit'
  post 'profile/enable-2fa' => 'users#enable_2fa'
  post 'profile/disable-2fa' => 'users#disable_2fa'
  post 'profile/generate-2fa-backup' => 'users#regenerate_2fa_backup_codes'
  post 'profile/acknowledge-cookies' => 'users#acknowledge_cookies'

  get 'profile/claim_wca_id' => 'users#claim_wca_id'
  get 'profile/claim_wca_id/select_nearby_delegate' => 'users#select_nearby_delegate'

  get 'users/:id/edit/avatar_thumbnail' => 'users#edit_avatar_thumbnail', as: :users_avatar_thumbnail_edit
  get 'users/:id/edit/pending_avatar_thumbnail' => 'users#edit_pending_avatar_thumbnail', as: :users_pending_avatar_thumbnail_edit
  get 'admin/avatars' => 'admin/avatars#index'
  post 'admin/avatars' => 'admin/avatars#update_all'

  get 'map' => 'competitions#embedable_map'

  get 'competitions/mine' => 'competitions#my_competitions', as: :my_comps
  get 'competitions/for_senior(/:user_id)' => 'competitions#for_senior', as: :competitions_for_senior
  post 'competitions/bookmark' => 'competitions#bookmark', as: :bookmark
  post 'competitions/unbookmark' => 'competitions#unbookmark', as: :unbookmark

  resources :competitions, only: [:index, :show, :edit, :update, :new, :create] do
    get 'results/podiums' => 'competitions#show_podiums'
    get 'results/all' => 'competitions#show_all_results'
    get 'results/by_person' => 'competitions#show_results_by_person'
    get 'scrambles' => 'competitions#show_scrambles'

    patch 'registrations/selected' => 'registrations#do_actions_for_selected', as: :registrations_do_actions_for_selected
    post 'registrations/export' => 'registrations#export', as: :registrations_export
    get 'registrations/import' => 'registrations#import', as: :registrations_import
    post 'registrations/import' => 'registrations#do_import', as: :registrations_do_import
    get 'registrations/add' => 'registrations#add', as: :registrations_add
    post 'registrations/add' => 'registrations#do_add', as: :registrations_do_add
    get 'registrations/psych-sheet' => 'registrations#psych_sheet', as: :psych_sheet
    get 'registrations/psych-sheet/:event_id' => 'registrations#psych_sheet_event', as: :psych_sheet_event
    resources :registrations, only: [:index, :update, :create, :edit, :destroy], shallow: true
    get 'edit/registrations' => 'registrations#edit_registrations'
    get 'register' => 'registrations#register'
    get 'register-require-sign-in' => 'registrations#register_require_sign_in'
    resources :competition_tabs, except: [:show], as: :tabs, path: :tabs
    get 'tabs/:id/reorder' => "competition_tabs#reorder", as: :tab_reorder
    # Delegate views and action
    get 'submit-results' => 'results_submission#new', as: :submit_results_edit
    post 'submit-results' => 'results_submission#create', as: :submit_results
    post 'upload-json' => 'results_submission#upload_json', as: :upload_results_json
    # WRT views and action
    get '/admin/upload-results' => "admin#new_results", as: :admin_upload_results_edit
    get '/admin/check-existing-results' => "admin#check_competition_results", as: :admin_check_existing_results
    post '/admin/check-existing-results' => "admin#do_check_competition_results", as: :admin_run_validators
    post '/admin/upload-json' => "admin#create_results", as: :admin_upload_results
    post '/admin/clear-submission' => "admin#clear_results_submission", as: :clear_results_submission
    get '/admin/import-results' => 'admin#import_results', as: :admin_import_results
    get '/admin/result-inbox-steps' => 'admin#result_inbox_steps', as: :admin_result_inbox_steps
    post '/admin/import-inbox-results' => 'admin#import_inbox_results', as: :admin_import_inbox_results
    delete '/admin/inbox-data' => 'admin#delete_inbox_data', as: :admin_delete_inbox_data
    delete '/admin/results-data' => 'admin#delete_results_data', as: :admin_delete_results_data
    get '/admin/results/:round_id/new' => 'admin/results#new', as: :new_result
  end

  get 'competitions/:competition_id/report/edit' => 'delegate_reports#edit', as: :delegate_report_edit
  get 'competitions/:competition_id/report' => 'delegate_reports#show', as: :delegate_report
  patch 'competitions/:competition_id/report' => 'delegate_reports#update'

  get 'competitions/:id/edit/admin' => 'competitions#admin_edit', as: :admin_edit_competition
  get 'competitions/:id/payment_setup' => 'competitions#payment_setup', as: :competitions_payment_setup
  get 'stripe-connect' => 'competitions#stripe_connect', as: :competitions_stripe_connect
  get 'competitions/:id/events/edit' => 'competitions#edit_events', as: :edit_events
  get 'competitions/:id/schedule/edit' => 'competitions#edit_schedule', as: :edit_schedule
  get 'competitions/edit/nearby_competitions' => 'competitions#nearby_competitions', as: :nearby_competitions
  get 'competitions/edit/series_eligible_competitions' => 'competitions#series_eligible_competitions', as: :series_eligible_competitions
  get 'competitions/edit/colliding_registration_start_competitions' => 'competitions#colliding_registration_start_competitions', as: :colliding_registration_start_competitions
  get 'competitions/edit/time_until_competition' => 'competitions#time_until_competition', as: :time_until_competition
  get 'competitions/:id/edit/clone_competition' => 'competitions#clone_competition', as: :clone_competition
  get 'competitions/edit/calculate_dues' => 'competitions#calculate_dues', as: :calculate_dues

  get 'results/rankings', to: redirect('results/rankings/333/single', status: 302)
  get 'results/rankings/333mbf/average',
      to: redirect(status: 302) { |params, request| URI.parse(request.original_url).query ? "results/rankings/333mbf/single?#{URI.parse(request.original_url).query}" : "results/rankings/333mbf/single" }
  get 'results/rankings/:event_id', to: redirect('results/rankings/%{event_id}/single', status: 302)
  get 'results/rankings/:event_id/:type' => 'results#rankings', as: :rankings
  get 'results/records' => 'results#records', as: :records

  scope '/admin' do
    resources :results, except: [:index, :new], controller: 'admin/results'
    post 'results' => 'admin/results#create'
    get 'events_data/:competition_id' => 'admin/results#show_events_data', as: :competition_events_data
  end

  get "media/validate" => 'media#validate', as: :validate_media
  resources :media, only: [:index, :new, :create, :edit, :update, :destroy]

  get 'export/results' => 'database#results_export', as: :db_results_export
  get 'export/developer' => 'database#developer_export', as: :db_dev_export
  # redirect from the old path that used to be linked on GitHub
  get 'wst/wca-developer-database-dump.zip', to: redirect('/export/developer/wca-developer-database-dump.zip')

  get 'persons/new_id' => 'admin/persons#generate_ids'
  resources :persons, only: [:index, :show]
  post 'persons' => 'admin/persons#create'

  resources :polls, only: [:edit, :new, :vote, :create, :update, :index, :destroy]
  get 'polls/:id/vote' => 'votes#vote', as: 'polls_vote'
  get 'polls/:id/results' => 'polls#results', as: 'polls_results'

  resources :teams, only: [:index, :update, :edit]

  resources :votes, only: [:create, :update]

  post 'competitions/:id/post_announcement' => 'competitions#post_announcement', as: :competition_post_announcement
  post 'competitions/:id/cancel' => 'competitions#cancel_competition', as: :competition_cancel
  post 'competitions/:id/post_results' => 'competitions#post_results', as: :competition_post_results
  post 'competitions/:id/orga_close_reg_when_full_limit' => 'competitions#orga_close_reg_when_full_limit', as: :competition_orga_close_reg_when_full_limit
  post 'competitions/:id/disconnect_stripe' => 'competitions#disconnect_stripe', as: :competition_disconnect_stripe

  get 'panel' => 'panel#index'
  get 'panel/delegate-crash-course', to: redirect('/edudoc/delegate-crash-course/delegate_crash_course.pdf', status: 302)
  patch 'panel/delegate-crash-course' => 'panel#update_delegate_crash_course'
  get 'panel/pending-claims(/:user_id)' => 'panel#pending_claims_for_subordinate_delegates', as: 'pending_claims'
  get 'panel/seniors' => 'panel#seniors'
  resources :notifications, only: [:index]

  root 'posts#homepage'
  resources :posts
  get 'rss' => 'posts#rss'

  post 'upload/image', to: 'upload#image'

  get 'admin/delegates' => 'delegates#stats', as: :delegates_stats

  get 'robots' => 'static_pages#robots'

  get 'server-status' => 'server_status#index'

  get 'translations', to: redirect('translations/status', status: 302)
  get 'translations/status' => 'translations#index'
  get 'translations/edit' => 'translations#edit'
  patch 'translations/update' => 'translations#update'

  get 'about' => 'static_pages#about'
  get 'contact' => 'static_pages#contact'
  get 'documents' => 'static_pages#documents'
  get 'education' => 'static_pages#education'
  get 'delegates' => 'static_pages#delegates'
  get 'disclaimer' => 'static_pages#disclaimer'
  get 'faq' => 'static_pages#faq'
  get 'logo' => 'static_pages#logo'
  get 'media-instagram' => 'static_pages#media_instagram'
  get 'merch' => 'static_pages#merch'
  get 'organizer-guidelines' => 'static_pages#organizer_guidelines'
  get 'privacy' => 'static_pages#privacy'
  get 'score-tools' => 'static_pages#score_tools'
  get 'speedcubing-history' => 'static_pages#speedcubing_history'
  get 'teams-committees' => 'static_pages#teams_committees'
  get 'tutorial' => redirect('/education', status: 302)
  get 'wca-workbook-assistant' => 'static_pages#wca_workbook_assistant'
  get 'wca-workbook-assistant-versions' => 'static_pages#wca_workbook_assistant_versions'

  resources :regional_organizations, only: [:new, :update, :edit, :destroy], path: '/regional-organizations'
  get 'organizations' => 'regional_organizations#index'
  get 'admin/regional-organizations' => 'regional_organizations#admin'
  delete 'admin/regional-organizations' => 'regional_organizations#destroy'
  patch 'regional-organizations/:id/edit' => 'regional_organizations#update'
  post 'regional-organizations/new' => 'regional_organizations#create'

  get 'disciplinary' => 'wdc#root'

  get 'contact/website' => 'contacts#website'
  post 'contact/website' => 'contacts#website_create'
  get 'contact/dob' => 'contacts#dob'
  post 'contact/dob' => 'contacts#dob_create'

  get '/regulations' => 'regulations#show', id: 'index'
  get '/regulations/*id' => 'regulations#show'

  get '/admin' => 'admin#index'
  get '/admin/all-voters' => 'admin#all_voters', as: :eligible_voters
  get '/admin/leader-senior-voters' => 'admin#leader_senior_voters', as: :leader_senior_voters
  get '/admin/check_results' => 'admin#check_results'
  get '/admin/validation_competitions' => "admin#compute_validation_competitions"
  post '/admin/check_results' => 'admin#do_check_results'
  get '/admin/merge_people' => 'admin#merge_people'
  post '/admin/merge_people' => 'admin#do_merge_people'
  get '/admin/edit_person' => 'admin#edit_person'
  get '/admin/fix_results' => 'admin#fix_results'
  get '/admin/fix_results_selector' => 'admin#fix_results_selector', as: :admin_fix_results_ajax
  patch '/admin/update_person' => 'admin#update_person'
  get '/admin/person_data' => 'admin#person_data'
  get '/admin/compute_auxiliary_data' => 'admin#compute_auxiliary_data'
  get '/admin/do_compute_auxiliary_data' => 'admin#do_compute_auxiliary_data'
  get '/admin/generate_exports' => 'admin#generate_exports'
  get '/admin/generate_db_token' => 'admin#generate_db_token'
  get '/admin/do_generate_dev_export' => 'admin#do_generate_dev_export'
  get '/admin/do_generate_public_export' => 'admin#do_generate_public_export'
  get '/admin/check_regional_records' => 'admin#check_regional_records'
  get '/admin/override_regional_records' => 'admin#override_regional_records'
  post '/admin/override_regional_records' => 'admin#do_override_regional_records'
  get '/admin/finish_persons' => 'admin#finish_persons'
  post '/admin/finish_persons' => 'admin#do_finish_persons'
  get '/admin/finish_unfinished_persons' => 'admin#finish_unfinished_persons'
  get '/admin/complete_persons' => 'admin#complete_persons'
  post '/admin/complete_persons' => 'admin#do_complete_persons'
  get '/admin/peek_unfinished_results' => 'admin#peek_unfinished_results'
  get '/admin/anonymize_person' => 'admin#anonymize_person'
  post '/admin/anonymize_person' => 'admin#do_anonymize_person'
  get '/admin/reassign_wca_id' => 'admin#reassign_wca_id'
  get '/admin/validate_reassign_wca_id' => 'admin#validate_reassign_wca_id'
  post '/admin/reassign_wca_id' => 'admin#do_reassign_wca_id'

  get '/search' => 'search_results#index'

  post '/render_markdown' => 'markdown_renderer#render_markdown'

  patch '/update_locale/:locale' => 'application#update_locale', as: :update_locale

  get '/.well-known/change-password' => redirect('/profile/edit?section=password', status: 302)

  # WFC section
  get '/wfc' => 'wfc#panel'
  scope 'wfc' do
    get '/competitions_export' => 'wfc#competition_export', defaults: { format: :csv }, as: :wfc_competitions_export
    resources :country_bands, only: [:index, :update, :edit], path: '/country-bands'
  end

  scope :archive do
    # NOTE: This is meant for displaying old content of the phpBB forum. It is DEPRECATED!
    resources :forums, only: [:index, :show]
    resources :forum_topics, only: [:show]
  end

  resources :incidents do
    patch '/mark_as/:kind' => 'incidents#mark_as', as: :mark_as
  end

  get '/sso-discourse' => 'users#sso_discourse'
  get '/redirect/wac-survey' => 'users#wac_survey'

  namespace :api do
    get '/', to: redirect('/api/v0', status: 302)
    namespace :v0 do
      get '/' => 'api#help'
      get '/me' => 'api#me'
      get '/auth/results' => 'api#auth_results'
      get '/export/public' => 'api#export_public'
      get '/scramble-program' => 'api#scramble_program'
      get '/search' => 'api#omni_search'
      get '/search/posts' => 'api#posts_search'
      get '/search/competitions' => 'api#competitions_search'
      get '/search/users' => 'api#users_search'
      get '/search/regulations' => 'api#regulations_search'
      get '/search/incidents' => 'api#incidents_search'
      get '/users/:id' => 'api#show_user_by_id', constraints: { id: /\d+/ }
      get '/users/:wca_id' => 'api#show_user_by_wca_id'
      get '/delegates' => 'api#delegates'
      get '/persons' => "persons#index"
      get '/persons/:wca_id' => "persons#show", as: :person
      get '/persons/:wca_id/results' => "persons#results", as: :person_results
      get '/persons/:wca_id/competitions' => "persons#competitions", as: :person_competitions
      get '/geocoding/search' => 'geocoding#get_location_from_query', as: :geocoding_search
      get '/countries' => 'api#countries'
      get '/competition_series/:id' => 'api#competition_series'
      resources :competitions, only: [:index, :show] do
        get '/wcif' => 'competitions#show_wcif'
        get '/wcif/public' => 'competitions#show_wcif_public'
        get '/results' => 'competitions#results', as: :results
        get '/results/:event_id' => 'competitions#event_results', as: :event_results
        get '/competitors' => 'competitions#competitors'
        get '/registrations' => 'competitions#registrations'
        get '/schedule' => 'competitions#schedule'
        get '/scrambles' => 'competitions#scrambles', as: :scrambles
        get '/scrambles/:event_id' => 'competitions#event_scrambles', as: :event_scrambles
        patch '/wcif' => 'competitions#update_wcif', as: :update_wcif
      end
      get '/records' => "api#records"
    end
  end
end
