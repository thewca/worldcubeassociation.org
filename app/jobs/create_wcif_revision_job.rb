# frozen_string_literal: true

class CreateWcifRevisionJob < ApplicationJob
  def perform(competition, editing_user, oauth_application)
    # Two quick PATCHes enqueue two jobs, which would otherwise race on the latest revision.
    competition.with_lock do
      wcif_json = competition.to_wcif(authorized: true, version: Competition::WCIF_VERSION_CATALOGUE[:latest]).to_json
      latest_revision = competition.wcif_revisions.last

      return if latest_revision.present? && latest_revision.wcif_json == wcif_json

      # Measured from creation, so a long editing session still leaves a revision every MERGE_WINDOW.
      continues_latest_revision = latest_revision.present? &&
                                  latest_revision.edited_by_id == editing_user.id &&
                                  latest_revision.oauth_application_id == oauth_application&.id &&
                                  latest_revision.created_at > WcifRevision::MERGE_WINDOW.ago

      revision = if continues_latest_revision
                   latest_revision
                 else
                   competition.wcif_revisions.build(
                     revision_number: (latest_revision&.revision_number || 0) + 1,
                     edited_by: editing_user,
                     oauth_application: oauth_application,
                   )
                 end

      revision.wcif_json = wcif_json
      revision.save!

      competition.wcif_revisions.reorder(revision_number: :desc).offset(WcifRevision::MAX_REVISIONS).destroy_all
    end
  end
end
