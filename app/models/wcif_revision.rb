# frozen_string_literal: true

class WcifRevision < ApplicationRecord
  MAX_REVISIONS = 50
  MERGE_WINDOW = 120.seconds

  belongs_to :competition
  belongs_to :edited_by, class_name: "User"
  # Not present when the WCIF was edited through the website itself, or the app was deleted since.
  belongs_to :oauth_application, class_name: "Doorkeeper::Application", optional: true

  has_one_attached :wcif_file

  def wcif_json
    ActiveSupport::Gzip.decompress(wcif_file.download)
  end

  def wcif_json=(json)
    wcif_file.attach(
      io: StringIO.new(ActiveSupport::Gzip.compress(json)),
      filename: "wcif.json.gz",
      content_type: "application/gzip",
    )
  end
end
