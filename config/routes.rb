# frozen_string_literal: true

require 'sidekiq/web'
require 'sidekiq/cron/web'

Rails.application.routes.draw do
  use_doorkeeper do
    controllers applications: 'oauth/applications'
  end
  use_doorkeeper_openid_connect

  # Sidekiq web UI, see https://github.com/sidekiq/sidekiq/wiki/Devise
  # Specifically referring to results because WRT needs access to this on top of regular admins.
  authenticate :user, ->(user) { user.can_admin_results? } do
    mount Sidekiq::Web => '/sidekiq'
  end

  # Don't expose Paypal routes in production until we're reading to launch
  post 'registration/:id/capture-paypal-payment' => 'registrations#capture_paypal_payment', as: :registration_capture_paypal_payment unless PaypalInterface.paypal_disabled?

  # Prevent account deletion, and overrides the sessions controller for 2FA.
  #  https://github.com/plataformatec/devise/wiki/How-To:-Disable-user-from-destroying-their-account
  devise_for :users, skip: :registrations, controllers: { sessions: "sessions" }
  devise_scope :user do
    get 'staging_login', to: 'sessions#staging_oauth_login' unless EnvConfig.WCA_LIVE_SITE?
    resource :registration,
             only: %i[new create],
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

  post 'registration/:id/load-payment-intent/:payment_integration' => 'registrations#load_payment_intent', as: :registration_payment_intent
  post 'competitions/:competition_id/refund/:payment_integration/:payment_id' => 'registrations#refund_payment', as: :registration_payment_refund
  get 'competitions/:competition_id/payment-completion/:payment_integration' => 'registrations#payment_completion', as: :registration_payment_completion
  post 'registration/stripe-webhook' => 'registrations#stripe_webhook', as: :registration_stripe_webhook
  get 'registration/:competition_id/:user_id/payment-denomination' => 'registrations#payment_denomination', as: :registration_payment_denomination
  get '/users/admin_search' => 'users#admin_search'
  resources :users, only: %i[index edit update]
  get 'users/show_for_edit' => 'users#show_for_edit', as: :user_show_for_edit
  get 'users/show_for_merge' => 'users#show_for_merge', as: :user_show_for_merge
  get 'profile/edit' => 'users#edit'
  post 'profile/enable-2fa' => 'users#enable_2fa'
  post 'profile/disable-2fa' => 'users#disable_2fa'
  post 'profile/generate-2fa-backup' => 'users#regenerate_2fa_backup_codes'
  post 'profile/acknowledge-cookies' => 'users#acknowledge_cookies'

  get 'profile/claim_wca_id' => 'users#claim_wca_id'
  get 'profile/claim_wca_id/select_nearby_delegate' => 'users#select_nearby_delegate'

  get 'users/:id/avatar' => 'users#avatar_data', as: :users_avatar_data
  post 'users/:id/avatar' => 'users#upload_avatar'
  patch 'users/:id/avatar' => 'users#update_avatar'
  delete 'users/:id/avatar' => 'users#delete_avatar'
  post 'users/update_user_data' => 'users#update_user_data'
  post 'users/merge' => 'users#merge'
  get '/users/registrations' => 'users#registrations', as: :helpful_queries_registrations
  get '/users/organized-competitions' => 'users#organized_competitions', as: :helpful_queries_organized_competitions
  get '/users/delegated-competitions' => 'users#delegated_competitions', as: :helpful_queries_delegated_competitions
  get '/users/past-competitions' => 'users#past_competitions', as: :helpful_queries_past_competitions
  get 'admin/avatars/pending' => 'admin/avatars#pending_avatar_users', as: :pending_avatars
  post 'admin/avatars' => 'admin/avatars#update_avatar', as: :admin_update_avatar

  get 'map' => 'competitions#embedable_map'

  get 'competitions/mine' => 'competitions#my_competitions', as: :my_comps
  get 'competitions/for_senior(/:user_id)' => 'competitions#for_senior', as: :competitions_for_senior
  post 'competitions/bookmark' => 'competitions#bookmark', as: :bookmark
  post 'competitions/unbookmark' => 'competitions#unbookmark', as: :unbookmark
  get 'competitions/registrations_v2/:competition_id/:user_id/edit' => 'registrations#redirect_v2_attendee'

  resources :competitions do
    get 'edit/admin' => 'competitions#admin_edit', as: :admin_edit

    get 'announcement_data' => 'competitions#announcement_data', as: :announcement_data
    get 'user_preferences' => 'competitions#user_preferences', as: :user_preferences
    get 'confirmation_data' => 'competitions#confirmation_data', as: :confirmation_data
    patch 'confirmation_data' => 'competitions#update_confirmation_data', as: :update_confirmation_data

    put 'confirm' => 'competitions#confirm', as: :confirm
    put 'announce' => 'competitions#announce', as: :announce
    put 'cancel' => 'competitions#cancel_or_uncancel', as: :cancel
    put 'close_full_registration' => 'competitions#close_full_registration', as: :close_full_registration

    patch 'user_preference/notifications' => 'competitions#update_user_notifications', as: :update_user_notifications

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
    resources :registrations, only: %i[index update create edit destroy], shallow: true
    get 'edit/registrations' => 'registrations#edit_registrations'
    get 'register' => 'registrations#register'
    resources :competition_tabs, except: [:show], as: :tabs, path: :tabs
    get 'tabs/:id/reorder' => "competition_tabs#reorder", as: :tab_reorder
    # Delegate views and action
    get 'newcomer-checks' => 'results_submission#newcomer_checks', as: :newcomer_checks
    get 'last-duplicate-checker-job' => 'results_submission#last_duplicate_checker_job_run', as: :last_duplicate_checker_job_run
    get 'newcomer-name-format-check' => 'results_submission#newcomer_name_format_check', as: :newcomer_name_format_check
    get 'newcomer-dob-check' => 'results_submission#newcomer_dob_check', as: :newcomer_dob_check
    post 'compute_potential_duplicates' => 'results_submission#compute_potential_duplicates', as: :compute_potential_duplicates
    get 'submit-results' => 'results_submission#new', as: :submit_results_edit
    get 'upload-scrambles' => 'results_submission#upload_scrambles', as: :upload_scrambles
    post 'submit-results' => 'results_submission#create', as: :submit_results
    resources :scramble_files, only: %i[index create destroy], shallow: true do
      patch 'update-round-matching' => 'scramble_files#update_round_matching', on: :collection
    end
    post 'upload-json' => 'results_submission#upload_json', as: :upload_results_json
    post 'import-from-live' => 'results_submission#import_from_live', as: :import_from_live
    # WRT views and action
    get '/admin/upload-results' => "admin#new_results", as: :admin_upload_results_edit
    get '/admin/check-existing-results' => "admin#check_competition_results", as: :admin_check_existing_results
    post '/admin/clear-submission' => "admin#clear_results_submission", as: :clear_results_submission
    delete '/admin/results-data' => 'admin#delete_results_data', as: :admin_delete_results_data
    get '/admin/results/:round_id/new' => 'admin/results#new', as: :new_result
    get '/admin/scrambles/:round_id/new' => 'admin/scrambles#new', as: :new_scramble

    get '/payment_integration/setup' => 'competitions#payment_integration_setup', as: :payment_integration_setup
    get '/payment_integration/setup/manual' => 'competitions#payment_integration_manual_setup', as: :manual_payment_setup
    get '/payment_integration/:payment_integration/connect' => 'competitions#connect_payment_integration', as: :connect_payment_integration
    post '/payment_integration/:payment_integration/disconnect' => 'competitions#disconnect_payment_integration', as: :disconnect_payment_integration
  end

  get 'competitions/:competition_id/report/edit' => 'delegate_reports#edit', as: :delegate_report_edit
  get 'competitions/:competition_id/report' => 'delegate_reports#show', as: :delegate_report
  patch 'competitions/:competition_id/report' => 'delegate_reports#update'
  delete 'competitions/:competition_id/report/:image_id' => 'delegate_reports#delete_image', as: :delegate_report_delete_image

  # Stripe needs this special redirect URL during OAuth, see the linked controller method for details
  get 'stripe-connect' => 'competitions#stripe_connect', as: :competitions_stripe_connect
  get 'competitions/:id/events/edit' => 'competitions#edit_events', as: :edit_events
  get 'competitions/:id/schedule/edit' => 'competitions#edit_schedule', as: :edit_schedule
  get 'competitions/edit/nearby_competitions' => 'competitions#nearby_competitions', as: :nearby_competitions
  get 'competitions/edit/series_eligible_competitions' => 'competitions#series_eligible_competitions', as: :series_eligible_competitions
  get 'competitions/edit/colliding_registration_start_competitions' => 'competitions#colliding_registration_start_competitions', as: :colliding_registration_start_competitions
  get 'competitions/:id/edit/clone_competition' => 'competitions#clone_competition', as: :clone_competition
  get 'competitions/edit/calculate_dues' => 'competitions#calculate_dues', as: :calculate_dues

  get 'competitions/edit/nearby-competitions-json' => 'competitions#nearby_competitions_json', as: :nearby_competitions_json
  get 'competitions/edit/registration-collisions-json' => 'competitions#registration_collisions_json', as: :registration_collisions_json
  get 'competitions/edit/series-eligible-competitions-json' => 'competitions#series_eligible_competitions_json', as: :series_eligible_competitions_json

  if Live::Config.enabled?
    get 'competitions/:competition_id/live/competitors/:registration_id' => 'live#by_person', as: :live_person_results
    get 'competitions/:competition_id/live/podiums' => 'live#podiums', as: :live_podiums
    get 'competitions/:competition_id/live/competitors' => 'live#competitors', as: :live_competitors
    get 'competitions/:competition_id/live/rounds/:round_id/admin' => 'live#admin', as: :live_admin_round_results
    get 'competitions/:competition_id/live/rounds/:round_id/admin/check' => 'live#double_check', as: :live_admin_check_round_results
    get 'competitions/:competition_id/live/admin' => 'live#schedule_admin', as: :live_schedule_admin
    get 'competitions/:competition_id/live/rounds/:round_id' => 'live#round_results', as: :live_round_results

    get 'api/competitions/:competition_id/rounds/:round_id' => 'live#round_results_api', as: :live_round_results_api
    post 'api/competitions/:competition_id/rounds/:round_id' => 'live#add_result', as: :add_live_result
    patch 'api/competitions/:competition_id/rounds/:round_id' => 'live#update_result', as: :update_live_result
  end

  get 'results/rankings', to: redirect('results/rankings/333/single', status: 302)
  get 'results/rankings/333mbf/average',
      to: redirect(status: 302) { |_params, request| URI.parse(request.original_url).query ? "results/rankings/333mbf/single?#{URI.parse(request.original_url).query}" : "results/rankings/333mbf/single" }
  get 'results/rankings/:event_id', to: redirect('results/rankings/%{event_id}/single', status: 302)
  get 'results/rankings/:event_id/:type' => 'results#rankings', as: :rankings
  get 'results/records' => 'results#records', as: :records

  scope '/admin' do
    resources :results, except: %i[index new], controller: 'admin/results'
    resources :scrambles, except: %i[index new], controller: 'admin/scrambles'
    get 'events_data/:competition_id' => 'admin/results#show_events_data', as: :competition_events_data
    get 'sanity-check' => "admin#sanity_check", as: :sanity_check
    get 'run-sanity-check' => "admin#run_sanity_check", as: :sanity_check_run
    get 'add-exclusion' => "admin#add_exclusion", as: :add_exclusion
  end

  get "media/validate" => 'media#validate', as: :validate_media
  resources :media, only: %i[index new create edit update destroy]

  get 'export/results' => 'database#results_export', as: :db_results_export
  get 'export/results/WCA_export.sql' => 'database#sql_permalink', as: :sql_permalink
  get 'export/results/WCA_export.tsv' => 'database#tsv_permalink', as: :tsv_permalink
  get 'export/results/:version/:file_type' => 'database#results_permalink', as: :results_permalink
  get 'export/developer' => 'database#developer_export', as: :db_dev_export
  get 'export/developer/wca-developer-database-dump', to: redirect(DbDumpHelper.public_s3_path(DbDumpHelper::DEVELOPER_EXPORT_SQL_PERMALINK))
  # redirect from the old path that used to be linked on GitHub
  get 'wst/wca-developer-database-dump.zip', to: redirect(DbDumpHelper.public_s3_path(DbDumpHelper::DEVELOPER_EXPORT_SQL_PERMALINK))

  get 'persons/new_id' => 'admin/persons#generate_ids'
  get '/persons/results' => 'admin/persons#results', as: :person_results
  resources :persons, only: %i[index show]
  post 'persons' => 'admin/persons#create'

  resources :polls, only: %i[edit new create update index destroy]
  get 'polls/:id/vote' => 'votes#vote', as: 'polls_vote'
  get 'polls/:id/results' => 'polls#results', as: 'polls_results'

  resources :votes, only: %i[create update]

  get 'panel/pending-claims(/:user_id)' => 'panel#pending_claims_for_subordinate_delegates', as: 'pending_claims'
  scope 'panel' do
    get 'volunteer' => 'panel#volunteer', as: :panel_volunteer
    get 'generate_db_token' => 'panel#generate_db_token', as: :panel_generate_db_token
    get 'competition_count' => 'panel#competition_count', as: :panel_competition_count
    get 'validators_for_competition_list' => 'panel#validators_for_competition_list', as: :panel_validators_for_competition_list
    get 'validators_for_competitions_in_range' => 'panel#validators_for_competitions_in_range', as: :panel_validators_for_competitions_in_range
    get 'cronjob_details' => 'panel#cronjob_details', as: :panel_cronjob_details
    post 'cronjob_run' => 'panel#cronjob_run', as: :panel_cronjob_run
    post 'cronjob_reset' => 'panel#cronjob_reset', as: :panel_cronjob_reset
  end
  get 'panel/:panel_id' => 'panel#index', as: :panel_index
  scope 'panel-page' do
    get 'fix-results' => 'admin#fix_results', as: :admin_fix_results
    get 'merge-profiles' => 'admin#merge_people', as: :admin_merge_people
  end
  get 'panel-page/:id' => 'panel#panel_page', as: :panel_page
  scope 'tickets' do
    get 'details_before_anonymization' => 'tickets#details_before_anonymization', as: :tickets_details_before_anonymization
    post 'anonymize' => 'tickets#anonymize', as: :tickets_anonymize
    get 'imported_temporary_results' => 'tickets#imported_temporary_results', as: :imported_temporary_results
  end
  resources :tickets, only: %i[index show] do
    post 'verify_warnings' => 'tickets#verify_warnings', as: :verify_warnings
    post 'merge_inbox_results' => 'tickets#merge_inbox_results', as: :merge_inbox_results
    post 'post_results' => 'tickets#post_results', as: :post_results
    get 'edit_person_validators' => 'tickets#edit_person_validators', as: :edit_person_validators
    get 'inbox_person_summary' => 'tickets#inbox_person_summary', as: :inbox_person_summary
    post 'delete_inbox_persons' => 'tickets#delete_inbox_persons', as: :delete_inbox_persons
    get 'events_merged_data' => 'tickets#events_merged_data', as: :events_merged_data
    post 'approve_edit_person_request' => 'tickets#approve_edit_person_request', as: :approve_edit_person_request
    post 'reject_edit_person_request' => 'tickets#reject_edit_person_request', as: :reject_edit_person_request
    post 'sync_edit_person_request' => 'tickets#sync_edit_person_request', as: :sync_edit_person_request
    resources :ticket_comments, only: %i[index create], as: :comments
    resources :ticket_logs, only: [:index], as: :logs
    resources :tickets_edit_person_fields, only: %i[create update destroy], as: :edit_person_fields
  end
  resources :notifications, only: [:index]

  root 'posts#homepage'
  resources :posts
  get 'livestream-management' => 'posts#livestream_management'
  post 'update-test-link' => 'posts#update_test_link'
  patch 'promote-test-link' => 'posts#promote_test_link'
  get 'wc2025-preview' => 'posts#wc2025_preview'
  get 'rss' => 'posts#rss'

  post 'upload/image', to: 'upload#image'

  get 'robots' => 'static_pages#robots'

  get 'help/api' => 'static_pages#api_help'

  get 'server-status' => 'server_status#index'

  get 'translations', to: redirect('translations/status', status: 302)
  get 'translations/status' => 'translations#index'
  get 'translations/edit' => 'translations#edit'
  patch 'translations/update' => 'translations#update'

  get 'about' => 'static_pages#about'
  get 'documents' => 'static_pages#documents'
  get 'education' => 'static_pages#education'
  get 'delegates' => 'static_pages#delegates'
  get 'disclaimer' => 'static_pages#disclaimer'
  get 'faq' => 'static_pages#faq'
  get 'logo' => 'static_pages#logo'
  get 'media-instagram' => 'static_pages#media_instagram'
  get 'merch', to: redirect('https://shop.worldcubeassociation.org/')
  get 'organizer-guidelines' => 'static_pages#organizer_guidelines'
  get 'privacy' => 'static_pages#privacy'
  get 'score-tools' => 'static_pages#score_tools'
  get 'speedcubing-history' => 'static_pages#speedcubing_history'
  get 'teams-committees' => 'static_pages#teams_committees'
  get 'tutorial' => redirect('/education', status: 302)
  get 'translators' => 'static_pages#translators'
  get 'officers-and-board' => 'static_pages#officers_and_board'

  resources :regional_organizations, only: %i[new create update edit destroy], path: '/regional-organizations'
  get 'organizations' => 'regional_organizations#index'
  get 'admin/regional-organizations' => 'regional_organizations#admin'

  get 'disciplinary' => 'wic#root'

  get 'contact' => 'contacts#index'
  post 'contact' => 'contacts#contact'
  scope 'contact' do
    get 'edit_profile' => 'contacts#edit_profile'
    post 'edit_profile' => 'contacts#edit_profile_action', as: :contact_edit_profile_action
    get 'dob' => 'contacts#dob', as: :contact_dob
    post 'dob' => 'contacts#dob_create'
  end

  get '/regulations' => 'regulations#show', id: 'index'
  get '/regulations/wca-regulations', to: redirect('https://regulations.worldcubeassociation.org/wca-regulations.pdf', status: 302)
  get '/regulations/wca-regulations-and-guidelines', to: redirect('https://regulations.worldcubeassociation.org/wca-regulations.pdf', status: 302)
  get '/regulations/full/wca-regulations-and-guidelines.merged', to: redirect('https://regulations.worldcubeassociation.org/wca-regulations.pdf', status: 302)
  get '/regulations/about' => 'regulations#about'
  get '/regulations/countries' => 'regulations#countries'
  get '/regulations/scrambles' => 'regulations#scrambles'
  get '/regulations/guidelines' => 'regulations#show'
  get '/regulations/full' => 'regulations#show'
  get '/regulations/translations' => 'regulations#translations'
  get '/regulations/translations/:language' => 'regulations_translations#translated_regulation'
  get '/regulations/translations/:language/guidelines' => 'regulations_translations#translated_guidelines'
  get '/regulations/translations/:language/:pdf' => "regulations_translations#translated_pdfs"
  get '/regulations/history' => 'regulations#history'
  get '/regulations/history/official/:id' => 'regulations#historical_regulations'
  get '/regulations/history/official/:id/guidelines' => 'regulations#historical_guidelines'
  get '/regulations/history/official/:id/wca-regulations-and-guidelines', to: redirect('https://regulations.worldcubeassociation.org/history/official/%{id}/wca-regulations-and-guidelines.pdf', status: 302)

  get '/admin/all-voters' => 'admin#all_voters', as: :eligible_voters
  get '/admin/leader-senior-voters' => 'admin#leader_senior_voters', as: :leader_senior_voters
  get '/admin/regional-voters' => 'admin#regional_voters', as: :regional_voters
  post '/admin/merge_people' => 'admin#do_merge_people', as: :admin_do_merge_people
  get '/admin/person_data' => 'admin#person_data'
  get '/admin/do_compute_auxiliary_data' => 'admin#do_compute_auxiliary_data'
  get '/admin/generate_db_token' => 'admin#generate_db_token'
  get '/admin/override_regional_records' => 'admin#override_regional_records'
  post '/admin/override_regional_records' => 'admin#do_override_regional_records'
  get '/admin/complete_persons' => 'admin#complete_persons'
  post '/admin/complete_persons' => 'admin#do_complete_persons'
  get '/admin/peek_unfinished_results' => 'admin#peek_unfinished_results'

  get '/search' => 'search_results#index'

  post '/render_markdown' => 'markdown_renderer#render_markdown'

  patch '/update_locale/:locale' => 'application#update_locale', as: :update_locale

  get '/.well-known/change-password' => redirect('/profile/edit?section=password', status: 302)

  # WFC section
  scope 'wfc' do
    get '/competitions_export' => 'wfc#competition_export', defaults: { format: :csv }, as: :wfc_competitions_export
    resources :country_bands, only: %i[index update edit], path: '/country-bands'
  end

  scope :archive do
    # NOTE: This is meant for displaying old content of the phpBB forum. It is DEPRECATED!
    resources :forums, only: %i[index show]
    resources :forum_topics, only: [:show]
  end

  resources :incidents do
    patch '/mark_as/:kind' => 'incidents#mark_as', as: :mark_as
  end

  get '/sso-discourse' => 'users#sso_discourse'
  get '/redirect/wac-survey' => 'users#wac_survey'

  scope 'admin' do
    get '/posting-index' => 'admin/results#posting_index', as: :results_posting_dashboard
    post '/start-posting' => 'admin/results#start_posting'
  end

  namespace :api do
    get '/', to: redirect('/help/api', status: 302)

    # While this is the start of a v1 API, this is currently not usable by outside developers as
    # getting a JWT token requires you to be logged in through the Website
    namespace :v1 do
      resources :competitions, only: [] do
        if Live::Config.enabled?
          namespace :live do
            get '/rounds/:round_id' => 'live#round_results', as: :live_round_results
            put '/rounds/:round_id/open' => "live#open_round", as: :live_round_open
            put '/rounds/:round_id/clear' => "live#clear_round", as: :live_round_clear
            put '/rounds/:round_id/:registration_id' => 'live#quit_competitor', as: :quit_competitor_from_round
            get '/podiums' => 'live#podiums', as: :live_podiums
            get '/registrations/:registration_id' => 'live#by_person', as: :get_live_by_person
            get '/rounds' => 'live#rounds', as: :live_admin
          end
        end

        resources :registrations, only: %i[index show create update], shallow: true do
          resource :history, only: %i[show], controller: :registration_history
          resource :payments, only: %i[show], controller: :registration_payments

          member do
            get 'payment_ticket', to: 'registrations#payment_ticket'
          end

          collection do
            patch 'bulk_auto_accept', to: 'registrations#bulk_auto_accept'
            patch 'bulk_update', to: 'registrations#bulk_update'
            get 'admin', to: 'registrations#index_admin'
            get ':user_id', to: 'registrations#show_by_user', as: :show_by_user
          end
        end

        member do
          get 'registration_config', to: 'registrations#registration_config', as: :registration_config
        end
      end
    end

    namespace :v0 do
      get '/', to: redirect('/help/api', status: 302)
      get '/me' => 'api#me'
      get '/healthcheck' => 'api#healthcheck'
      get '/auth/results' => 'api#auth_results'
      get '/export/public' => 'api#export_public'
      get '/scramble-program' => 'api#scramble_program'
      get '/known-timezones' => 'api#known_timezones'
      get '/search' => 'api#omni_search'
      get '/search/posts' => 'api#posts_search'
      get '/search/competitions' => 'api#competitions_search'
      get '/search/users' => 'api#users_search', as: :search_users
      get '/search/persons' => 'api#persons_search', as: :search_persons
      get '/search/regulations' => 'api#regulations_search'
      get '/search/incidents' => 'api#incidents_search'
      get '/users' => 'users#show_users_by_id'
      post '/users' => 'users#show_users_by_id'
      get '/users/me' => 'users#show_me'
      get '/users/me/personal_records' => 'users#personal_records'
      get '/users/me/preferred_events' => 'users#preferred_events'
      get '/users/me/permissions' => 'users#permissions'
      get '/users/me/bookmarks' => 'users#bookmarked_competitions'
      get '/users/:id' => 'users#show_user_by_id', constraints: { id: /\d+/ }
      get '/users/:wca_id' => 'users#show_user_by_wca_id', as: :user
      get '/delegates' => 'api#delegates'
      get '/delegates/search-index' => 'api#delegates_search_index', as: :delegates_search_index
      get '/persons' => "persons#index"
      get '/persons/:wca_id' => "persons#show", as: :person
      get '/persons/:wca_id/results' => "persons#results", as: :person_results
      get '/persons/:wca_id/records' => "persons#records", as: :person_records
      get '/persons/:wca_id/competitions' => "persons#competitions", as: :person_competitions
      get '/persons/:wca_id/personal_records' => "persons#personal_records", as: :personal_records
      get '/regulations/translations' => 'regulations#translations', as: :regulations_translations
      get '/geocoding/search' => 'geocoding#location_from_query', as: :geocoding_search
      get '/geocoding/time_zone' => 'geocoding#time_zone_from_coordinates', as: :geocoding_time_zone
      get '/countries' => 'api#countries'
      get '/records' => "api#records"
      get '/results/:user_id/qualification_data' => 'api#user_qualification_data', as: :user_qualification_data
      get '/competition_series/:id' => 'api#competition_series'
      get '/competition_index' => 'competitions#competition_index', as: :competition_index
      get '/competitions/mine' => 'competitions#mine', as: :my_competitions

      resources :incidents, only: %i[index]
      resources :regional_organizations, only: %i[index], path: '/regional-organizations'

      namespace :results do
        get '/rankings/:event_id/:type' => 'rankings#index'

        resources :records, only: %i[index show] do
          get '/history' => 'results#history'
        end
      end

      resources :competitions, only: %i[index show] do
        get '/wcif' => 'competitions#show_wcif'
        get '/wcif/public' => 'competitions#show_wcif_public'
        get '/results' => 'competitions#results', as: :results
        get '/results/:event_id' => 'competitions#event_results', as: :event_results
        get '/competitors' => 'competitions#competitors'
        get '/qualifications' => 'competitions#qualifications'
        get '/registrations' => 'competitions#registrations'
        get '/events' => 'competitions#events'
        get '/schedule' => 'competitions#schedule'
        get '/tabs' => 'competitions#tabs'
        get '/podiums' => 'competitions#podiums'
        get '/scrambles' => 'competitions#scrambles', as: :scrambles
        get '/scrambles/:event_id' => 'competitions#event_scrambles', as: :event_scrambles
        get '/psych-sheet/:event_id' => 'competitions#event_psych_sheet', as: :event_psych_sheet
        patch '/wcif' => 'competitions#update_wcif', as: :update_wcif
      end

      post '/registration-data' => 'competitions#registration_data', as: :registration_data

      scope 'user_roles' do
        get '/search' => 'user_roles#search', as: :user_roles_search
      end
      resources :user_roles, only: %i[index show create update destroy]
      resources :user_groups, only: %i[index create update]
      namespace :wrt do
        resources :persons, only: %i[update destroy] do
          put '/reset_claim_count' => 'persons#reset_claim_count', as: :reset_claim_count
        end
      end
      namespace :wfc do
        resources :xero_users, only: %i[index create update]
        resources :dues_redirects, only: %i[index create destroy]
      end
    end
  end

  # Deprecated Links
  get 'teams-committees-councils' => redirect('teams-committees')
  get 'panel/delegate-crash-course' => redirect('panel/delegate#delegate-handbook')
  get 'panel' => redirect('panel/volunteer')
end
