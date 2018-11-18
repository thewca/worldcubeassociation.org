# frozen_string_literal: true

class SyncMailingListsJob < ApplicationJob
  queue_as :default

  def perform
    GsuiteMailingLists.sync_group("delegates@worldcubeassociation.org", User.delegates)
    GsuiteMailingLists.sync_group("leaders@worldcubeassociation.org", TeamMember.current.where(team_leader: true).map(&:user))
    GsuiteMailingLists.sync_group("results@worldcubeassociation.org", Team.wrt.current_members.includes(:user).map(&:user))
  end
end
