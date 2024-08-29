# frozen_string_literal: true

class GroupsMetadataTeamsCommittees < ApplicationRecord
  include Cachable

  has_one :user_group, as: :metadata

  # This has to happen before the `cached_reader` call below, because otherwise that call doesn't know what to index by
  def cachable_id
    self.friendly_id
  end

  cached_entity :wct, :wcat, :wic, :wdpc, :weat, :wfc, :wmt, :wqac, :wrc, :wrt, :wst, :wst_admin, :wct_china, :wat, :wsot, :wapc

  enum :preferred_contact_mode, {
    no_contact: "no_contact",
    email: "email",
    contact_form: "contact_form",
  }
end
