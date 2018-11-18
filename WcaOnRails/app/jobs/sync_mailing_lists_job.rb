# frozen_string_literal: true

class SyncMailingListsJob < ApplicationJob
  queue_as :default

  def perform
    GsuiteMailingLists.sync_group("delegates@worldcubeassociation.org", User.delegates)
  end
end
