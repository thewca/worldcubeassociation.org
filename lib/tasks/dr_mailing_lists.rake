# frozen_string_literal: true

def make_gmail_group(email, name, prefix)
  Google::Apis::AdminDirectoryV1::Group.new(
    email: email,
    name: "[Delegate Reports] [#{prefix.capitalize}] #{name}",
    description: "[Automatically managed] Mailing list for Delegate Reports that contains all people who subscribed to the #{name} region.",
  )
end

def group_exists?(service, email)
  service.get_group(email).present?
rescue Google::Apis::ClientError => e
  e.status_code != 404
end

def create_missing_lists(service, model, &)
  model.real.each do |entity|
    email = yield entity
    entity_name = entity.name_in(:en)

    entity_group = make_gmail_group(email, entity_name, model.name)
    group_exists = group_exists?(service, email)

    service.insert_group(entity_group) unless group_exists
  end
end

namespace :dr_mailing_lists do
  desc "Create country and continent mailing lists"
  task create: :environment do
    gmail_service = GsuiteMailingLists.get_service

    create_missing_lists(gmail_service, Country) do |country|
      DelegateReport.country_mailing_list(country)
    end

    create_missing_lists(gmail_service, Continent) do |continent|
      DelegateReport.continent_mailing_list(continent)
    end
  end
end
