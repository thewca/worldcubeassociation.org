# frozen_string_literal: true

class ScrambleFileUpload < ApplicationRecord
  belongs_to :uploaded_by_user, foreign_key: "uploaded_by", class_name: "User"
  belongs_to :competition

  has_many :inbox_scramble_sets, inverse_of: :scramble_file_upload

  serialize :raw_wcif, coder: JSON
end
