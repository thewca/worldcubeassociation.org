# frozen_string_literal: true

after :sanity_check_categories do
  SanityCheck.load_json_data!
end
