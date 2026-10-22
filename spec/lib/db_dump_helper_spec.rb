# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DbDumpHelper do
  describe "#dump_payload_db" do
    let(:wca_collections) { %w[pages globals] }
    let(:internal_collections) { %w[_pages_versions payload-locked-documents] }
    let(:payload_collections) { wca_collections + internal_collections + %w[users sessions] }
    let(:physical_collections) { payload_collections }

    before do
      schema_manifest = {
        physical: physical_collections,
        payload: payload_collections,
        internal: internal_collections,
        wca: wca_collections,
      }

      stub_request(:get, "#{EnvConfig.NEXT_FRONTEND_URL}/#{DbDumpHelper::PAYLOAD_SCHEMA_MANIFEST_PATH}")
        .to_return(status: 200, body: schema_manifest.to_json, headers: { 'Content-Type' => 'application/json' })
    end

    context "when MongoDB has a collection that Payload does not know about" do
      let(:physical_collections) { payload_collections + %w[leftover_collection] }

      it "fails without dumping" do
        expect(DbDumpHelper).not_to receive(:system)
        expect { DbDumpHelper.dump_payload_db }.to raise_error(DbDumpHelper::PayloadSchemaAuditError, /leftover_collection/)
      end
    end

    context "when Payload has a collection that is neither ours nor confidential" do
      let(:payload_collections) { wca_collections + internal_collections + %w[users sessions two_factors] }

      it "fails without dumping" do
        expect(DbDumpHelper).not_to receive(:system)
        expect { DbDumpHelper.dump_payload_db }.to raise_error(DbDumpHelper::PayloadSchemaAuditError, /two_factors/)
      end
    end

    context "when the audit passes" do
      it "dumps without the confidential collections" do
        exclude_flags = DbDumpHelper::PAYLOAD_CONFIDENTIAL_COLLECTIONS.map { "--excludeCollection=#{it}" }

        expect(DbDumpHelper).to receive(:system).with("mongodump", any_args, *exclude_flags, exception: true)
        expect(DbDumpHelper).to receive(:zip_and_upload_to_s3).with("dump.zip", DbDumpHelper::PAYLOAD_EXPORT_PERMALINK, any_args)

        DbDumpHelper.dump_payload_db
      end
    end
  end
end
