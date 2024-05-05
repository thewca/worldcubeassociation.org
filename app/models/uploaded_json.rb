# frozen_string_literal: true

# NOTE: placeholder model to be extended
# For now it just records the uploaded json for a given competition, but it could also hold a list of warnings and errors the Delegate got, to be sent to the WRT.
class UploadedJson < ApplicationRecord
  belongs_to :competition
  validates_presence_of :json_str, allow_nil: false
end
