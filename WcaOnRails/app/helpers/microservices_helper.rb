# frozen_string_literal: true

module MicroServicesHelper
  # Because these routes don't live in the monolith anymore we need some helper functions
  def competition_register_path(competition_id)
    "https://#{EnvVars.ROOT_URL}/competitions/#{competition_id}/register"
  end

  def edit_registration_path(competition_id, user_id)
    "https://#{EnvVars.ROOT_URL}/competitions/#{competition_id}/#{user_id}/edit"
  end
end
