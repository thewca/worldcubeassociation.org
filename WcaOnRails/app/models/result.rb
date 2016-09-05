# frozen_string_literal: true
class Result < ActiveRecord::Base
  self.table_name = "Results"

  belongs_to :competition, foreign_key: :competitionId
  belongs_to :person, primary_key: :wca_id, foreign_key: :personId

  scope :podium, -> { where(roundId: Round.final_rounds.map(&:id), pos: [1..3]).where("best > 0") }

  def to_s(field)
    SolveTime.new(eventId, field, send(field)).clock_format
  end

  def self.search_by_person(wca_id, params: {})
    results = Result.select('pos', 'personId', 'competitionId', 'eventId', 'roundId', 'formatId', 'value1', 'value2', 'value3', 'value4', 'value5', 'best', 'average', 'regionalSingleRecord', 'regionalAverageRecord')
    .where(personId: wca_id)

    if params[:competitionId].present?
      competition = Competition.find_by_id(params[:competitionId])
      if !competition
        raise WcaExceptions::BadApiParameter, "Competition does not exist: '#{params[:competitionId]}'"
      end
      results = results.where(competitionId: competition.id)
    end

    if params[:eventId].present?
      results = results.where(eventId: params[:eventId])
    end

    if params[:roundId].present?
      results = results.where(roundId: params[:roundId])
    end

    results.group_by(&:eventId)
  end

  def self.search_by_competition(competitionId, params: {})
    results = Result.select('pos', 'personId', 'personName', 'competitionId', 'eventId', 'roundId', 'formatId', 'value1', 'value2', 'value3', 'value4', 'value5', 'best', 'average', 'regionalSingleRecord', 'regionalAverageRecord')
    .where(competitionId: competitionId)

    if params[:wca_id].present?
      results = results.where(personId: params[:wca_id])
    end

    if params[:eventId].present?
      results = results.where(eventId: params[:eventId])
    end

    if params[:roundId].present?
      results = results.where(roundId: params[:roundId])
    end

    results.group_by(&:eventId)
  end
end
