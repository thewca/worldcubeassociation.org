# frozen_string_literal: true

3.times { RolesMetadataOfficers.create!(status: :executive_director) }

3.times { RolesMetadataOfficers.create!(status: RolesMetadataOfficers.statuses[:chair]) }

3.times { RolesMetadataOfficers.create!(status: RolesMetadataOfficers.statuses[:vice_chair]) }

4.times { RolesMetadataOfficers.create!(status: RolesMetadataOfficers.statuses[:secretary]) }

3.times { RolesMetadataOfficers.create!(status: RolesMetadataOfficers.statuses[:treasurer]) }
