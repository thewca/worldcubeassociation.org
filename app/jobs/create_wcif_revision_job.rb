# frozen_string_literal: true

class CreateWcifRevisionJob < ApplicationJob
  def perform(competition, editing_user, oauth_application)
    wcif_json = competition.to_wcif(version: Competition::WCIF_VERSION_CATALOGUE[:latest]).to_json
    latest_revision = competition.wcif_revisions.last

    return if latest_revision.present? && latest_revision.wcif_json == wcif_json

    # Measured from creation, so a long editing session still leaves a revision every MERGE_WINDOW.
    continues_latest_revision = latest_revision.present? &&
                                latest_revision.edited_by == editing_user &&
                                latest_revision.oauth_application == oauth_application &&
                                latest_revision.created_at > WcifRevision::MERGE_WINDOW.ago

    if continues_latest_revision
      latest_revision.update!(wcif_json: wcif_json)
    else
      competition.wcif_revisions.create!(
        # Never reused, so a revision keeps its name after older ones are rotated out.
        # Two jobs picking the same number fail on the unique index, and the retry takes a fresh snapshot.
        revision_number: (latest_revision&.revision_number || 0) + 1,
        edited_by: editing_user,
        oauth_application: oauth_application,
        wcif_json: wcif_json,
      )
    end

    competition.wcif_revisions.reorder(revision_number: :desc).offset(WcifRevision::MAX_REVISIONS).destroy_all
  end
end
