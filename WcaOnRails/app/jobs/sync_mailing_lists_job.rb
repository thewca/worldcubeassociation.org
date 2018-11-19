# frozen_string_literal: true

class SyncMailingListsJob < ApplicationJob
  queue_as :default

  def perform
    GsuiteMailingLists.sync_group("candidates@worldcubeassociation.org", User.candidate_delegates)
    GsuiteMailingLists.sync_group("delegates@worldcubeassociation.org", User.delegates)
    GsuiteMailingLists.sync_group("seniors@worldcubeassociation.org", User.senior_delegates)
    GsuiteMailingLists.sync_group("leaders@worldcubeassociation.org", TeamMember.current.where(team_leader: true).map(&:user))
    GsuiteMailingLists.sync_group("board@worldcubeassociation.org", Team.board.current_members.includes(:user).map(&:user))
    GsuiteMailingLists.sync_group("communication@worldcubeassociation.org", Team.wct.current_members.includes(:user).map(&:user))
    GsuiteMailingLists.sync_group("competitions@worldcubeassociation.org", Team.wcat.current_members.includes(:user).map(&:user))
    GsuiteMailingLists.sync_group("disciplinary@worldcubeassociation.org", Team.wdc.current_members.includes(:user).map(&:user))
    GsuiteMailingLists.sync_group("ethics@worldcubeassociation.org", Team.wec.current_members.includes(:user).map(&:user))
    GsuiteMailingLists.sync_group("finance@worldcubeassociation.org", Team.wfc.current_members.includes(:user).map(&:user))
    GsuiteMailingLists.sync_group("marketing@worldcubeassociation.org", Team.wmt.current_members.includes(:user).map(&:user))
    GsuiteMailingLists.sync_group("quality@worldcubeassociation.org", Team.wqac.current_members.includes(:user).map(&:user))
    GsuiteMailingLists.sync_group("regulations@worldcubeassociation.org", Team.wrc.current_members.includes(:user).map(&:user))
    GsuiteMailingLists.sync_group("results@worldcubeassociation.org", Team.wrt.current_members.includes(:user).map(&:user))
    GsuiteMailingLists.sync_group("software@worldcubeassociation.org", Team.wst.current_members.includes(:user).map(&:user))
    translators = User.where(id: TranslationsController::VERIFIED_TRANSLATORS_BY_LOCALE.values.flatten)
    GsuiteMailingLists.sync_group("translators@worldcubeassociation.org", translators)
  end
end
