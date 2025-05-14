# frozen_string_literal: true

class ScrambleFileUpload < ApplicationRecord
  belongs_to :uploaded_by_user, foreign_key: "uploaded_by", class_name: "User"
  belongs_to :competition

  has_many :inbox_scramble_sets, inverse_of: :scramble_file_upload

  serialize :raw_wcif, coder: JSON

  DEFAULT_SERIALIZE_OPTIONS = {
    except: %w[raw_wcif],
    include: %w[inbox_scramble_sets],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
