# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Database Endpoints' do
  describe 'export' do
    describe 'v1 paths' do
      context 'before 2026-01-16' do
        before { travel_to Time.new(2026, 1, 15) }

        it 'returns SQL link before 2026-01-16' do
          get sql_permalink_path
          expect(response).to have_http_status(:moved_permanently)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v1_329_20251125T000000Z.sql.zip")
        end

        it 'returns TSV link before 2026-01-16' do
          get tsv_permalink_path
          expect(response).to have_http_status(:moved_permanently)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v1_329_20251125T000000Z.tsv.zip")
        end
      end

      context 'on 2026-01-16' do
        before { travel_to Time.new(2026, 1, 16) }

        it 'SQL link returns 410 on and after 2026-01-16' do
          get sql_permalink_path
          expect(response).to have_http_status(:gone)
          expect(response.location).to be_nil
        end

        it 'TSV link returns 410 on and after 2026-01-16' do
          get tsv_permalink_path
          expect(response).to have_http_status(:gone)
          expect(response.location).to be_nil
        end
      end
    end

    describe 'results_permalink' do
      it "returns 404 error if the requested version doesn't exist" do
        get results_permalink_path(:v99, "sql")
        expect(response).to have_http_status(:not_found)
      end

      it "returns 404 error if requested filetype doesn't exist" do
        get results_permalink_path(:v2, "foo")
        expect(response).to have_http_status(:not_found)
      end

      context 'before 2026-01-16' do
        before { travel_to Time.new(2026, 1, 15) }

        it 'returns v1 SQL' do
          get results_permalink_path(:v1, "sql")
          expect(response).to have_http_status(:moved_permanently)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v1_329_20251125T000000Z.sql.zip")
        end

        it 'returns v1 TSV' do
          get results_permalink_path(:v1, "tsv")
          expect(response).to have_http_status(:moved_permanently)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v1_329_20251125T000000Z.tsv.zip")
        end

        it 'returns v2 SQL' do
          get results_permalink_path(:v2, "sql")
          expect(response).to have_http_status(:moved_permanently)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v2_329_20251125T000000Z.sql.zip")
        end

        it 'returns v2 TSV' do
          get results_permalink_path(:v2, "tsv")
          expect(response).to have_http_status(:moved_permanently)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v2_329_20251125T000000Z.tsv.zip")
        end
      end

      context 'on 2026-01-16' do
        before { travel_to Time.new(2026, 1, 16) }

        it 'v1 SQL link returns 410 on and after 2026-01-16' do
          get results_permalink_path(:v1, "sql")
          expect(response).to have_http_status(:gone)
          expect(response.location).to be_nil
        end

        it 'v1 TSV link returns 410 on and after 2026-01-16' do
          get results_permalink_path(:v1, "tsv")
          expect(response).to have_http_status(:gone)
          expect(response.location).to be_nil
        end

        it 'returns v2 SQL' do
          get results_permalink_path(:v2, "sql")
          expect(response).to have_http_status(:moved_permanently)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v2_329_20251125T000000Z.sql.zip")
        end

        it 'returns v2 TSV' do
          get results_permalink_path(:v2, "tsv")
          expect(response).to have_http_status(:moved_permanently)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v2_329_20251125T000000Z.tsv.zip")
        end
      end
    end
  end
end
