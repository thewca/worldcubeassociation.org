# frozen_string_literal: true

ENV['GOOGLE_APPLICATION_CREDENTIALS'] = AppSecrets.GOOGLE_APPLICATION_CREDENTIALS

require 'googleauth'
require 'googleauth/stores/file_token_store'
require 'google/apis/admin_directory_v1'

module GsuiteMailingLists
  # The Board may be required to act as Senior for multiple regions. Unfortunately, this clashes with assumptions
  # about one Delegate only leading one region in the `users` SQL table. So we realise this feature by hijacking aliases
  # but Google complains when trying to add multiple aliases to seniors@ or delegates@.
  BOARD_PRIMARY_EMAIL = "board@worldcubeassociation.org"

  def self.sync_group(group, desired_emails)
    service = get_service

    desired_emails = desired_emails.map do |email|
      if email.include?("+")
        old_email = email
        email = email.gsub(/\+[^@]*/, '')
        puts "Warning: '#{old_email}' contains a plus sign, and google groups seems to not support + signs in email addresses, so we're going to add '#{email}' instead."
      end
      email
    end

    # Aliases should only be removed if the primary address is in use as well. This works because the "list_members"
    # invocation from Google only returns non-alias mail addresses. In cases where the "hijacked" alias Senior
    # should be part of their own regional sub-list, we don't need to remove him if the root address is not included.
    if desired_emails.include?(BOARD_PRIMARY_EMAIL)
      board_aliases = service.list_group_aliases(BOARD_PRIMARY_EMAIL)

      # This is using a Hash key access because Google is not deserializing their own responses properly
      # and doing it for them only for the sake of retrieving one key seems overkill.
      #
      # see https://github.com/googleapis/google-api-ruby-client/blob/google-api-client/v0.53.0/generated/google-apis-admin_directory_v1/lib/google/apis/admin_directory_v1/representations.rb#L555
      board_aliases = board_aliases.aliases.map { |a| a['alias'] }

      contained_aliases = desired_emails & board_aliases
      unless contained_aliases.empty?
        desired_emails -= contained_aliases
        puts "Warning: Board aliases are contained in the sync group. #{contained_aliases} have been removed."
      end
    end

    members = service.fetch_all(items: :members) do |token|
      service.list_members(group, page_token: token)
    end
    current_emails = members.map(&:email)

    emails_to_remove = current_emails - desired_emails
    emails_to_add = desired_emails - current_emails

    # First, remove all the emails we don't want.
    emails_to_remove.each do |email|
      service.delete_member(group, email)
    end

    # Last, add all the emails we do want.
    emails_to_add.each do |email|
      new_member = Google::Apis::AdminDirectoryV1::Member.new(email: email)
      service.insert_member(group, new_member)
    end
  end

  def self.get_service
    scopes = [
      'https://www.googleapis.com/auth/admin.directory.group',
    ]
    authorization = Google::Auth.get_application_default(scopes)

    Google::Apis::AdminDirectoryV1::DirectoryService.new.tap do |service|
      service.authorization = authorization
    end
  end
end
