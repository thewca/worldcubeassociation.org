# frozen_string_literal: true

module Types
  class BaseField < GraphQL::Schema::Field
    # Pass `field ..., require_authorization: true` to hide this field from non-admin users
    def initialize(*, require_authorization: false, **, &block)
      @require_authorization = require_authorization
      super(*, **, &block)
    end

    def authorized?(object, args, context)
      # if `require_authorization:` was given, then require the current user to be a manager of the competition
      authorized = context[:current_user]&.can_manage_competition?(object)
      super && (@require_authorization ? authorized : true)
    end

    def visible?(context)
      # only show these fields in introspective queries when a user is present
      authenticated = context[:current_user].present?
      super && (@require_authorization ? authenticated : true)
    end
    argument_class Types::BaseArgument
  end
end
