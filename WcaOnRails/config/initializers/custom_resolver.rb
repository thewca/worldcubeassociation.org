class CustomResolver < ActiveRecord::Middleware::DatabaseSelector::Resolver
    # The parent method returns true only if the session
    # must read from the primary, but we would also like to
    # read from the primary about half the time in order to distribute
    # the load among our two instances
    def read_from_primary?
      super || rand(2) == 0
    end
  end