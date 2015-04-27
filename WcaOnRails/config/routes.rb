Rails.application.routes.draw do
  root 'static_pages#home'
  get 'about' => 'static_pages#about'
  get 'delegates' => 'static_pages#delegates'
  get 'organisations' => 'static_pages#organisations'
  get 'contact' => 'static_pages#contact'
  get 'score-tools' => 'static_pages#score_tools'
  get 'logo' => 'static_pages#logo'
  get 'wca-workbook-assistant' => 'static_pages#wca_workbook_assistant'
  get 'wca-workbook-assistant-versions' => 'static_pages#wca_workbook_assistant_versions'
end
