# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Database Endpoints' do
  describe 'export' do
    describe 'v1 paths' do
      context 'before 2026-01-01' do
        before { travel_to Time.new(2025, 12, 31) }

        it 'returns SQL link before 2026-01-01' do
          get sql_permalink_path
          expect(response.status).to eq(301)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v1_329_20251125T000000Z.sql.zip")
        end

        it 'returns TSV link before 2026-01-01' do
          get tsv_permalink_path
          expect(response.status).to eq(301)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v1_329_20251125T000000Z.tsv.zip")
        end
      end

      context 'on 2026-01-01' do
        before { travel_to Time.new(2026, 1, 1) }

        it 'SQL link returns 410 on and after 2026-01-01' do
          get sql_permalink_path
          expect(response.status).to eq(410)
          expect(response.location).to be nil
        end

        it 'TSV link returns 410 on and after 2026-01-01' do
          get tsv_permalink_path
          expect(response.status).to eq(410)
          expect(response.location).to be nil
        end
      end
    end

    describe 'results_permalink' do
      context 'before 2026-01-01' do
        before { travel_to Time.new(2025, 12, 31) }

        it 'returns v1 SQL' do
          get results_permalink_path(:v1, "sql")
          expect(response.status).to eq(301)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v1_329_20251125T000000Z.sql.zip")
        end

        it 'returns v1 TSV' do
          get results_permalink_path(:v1, "tsv")
          expect(response.status).to eq(301)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v1_329_20251125T000000Z.tsv.zip")
        end

        it 'returns v2 SQL' do
          get results_permalink_path(:v2, "sql")
          expect(response.status).to eq(301)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v2_329_20251125T000000Z.sql.zip")
        end

        it 'returns v2 TSV' do
          get results_permalink_path(:v2, "tsv")
          expect(response.status).to eq(301)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v2_329_20251125T000000Z.tsv.zip")
        end
      end

      context 'on 2026-01-01' do
        before { travel_to Time.new(2026, 1, 1) }

        it 'v1 SQL link returns 410 on and after 2026-01-01' do
          get results_permalink_path(:v1, "sql")
          expect(response.status).to eq(410)
          expect(response.location).to be nil
        end

        it 'v1 TSV link returns 410 on and after 2026-01-01' do
          get results_permalink_path(:v1, "tsv")
          expect(response.status).to eq(410)
          expect(response.location).to be nil
        end

        it 'returns v2 SQL' do
          get results_permalink_path(:v2, "sql")
          expect(response.status).to eq(301)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v2_329_20251125T000000Z.sql.zip")
        end

        it 'returns v2 TSV' do
          get results_permalink_path(:v2, "tsv")
          expect(response.status).to eq(301)
          expect(response.location).to eq("https://assets.worldcubeassociation.org/WCA_export_v2_329_20251125T000000Z.tsv.zip")
        end
      end
    end
  end
end
