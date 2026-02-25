# frozen_string_literal: true

# NOTE: placeholder model to be extended
# For now it just records the uploaded json for a given competition, but it could also hold a list of warnings and errors the Delegate got, to be sent to the WRT.
class UploadedJson < ApplicationRecord
  belongs_to :competition

  validates :json_str, presence: { allow_nil: false }

  enum :upload_type, {
    results_json: 'results_json',
    wca_live: 'wca_live',
  }
end
