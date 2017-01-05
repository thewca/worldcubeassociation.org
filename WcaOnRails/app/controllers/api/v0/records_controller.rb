class Api::V0::RecordsController < Api::V0::ApiController
  def regionCondition(countrySource)
    if params[:regionId]
      region = params[:regionId]


      if /^(world)?$/i.match(region)
        return ''
      elsif /^_/.match(region)
        return "AND continentId = \'#{region}\'"
      else
        if countrySource
          countrySource += '.'
        end

        return "AND #{countrySource}countryId = \'#{region}\'"
      end
    end

    return ''
  end

  def eventCondition
    if params[:eventId]
      return "AND eventId = '#{params[:eventId]}'"
    else
      return ''
    end
  end

  def yearCondition
    if params[:tillYear]
      return "AND year <= '#{params[:tillYear]}'"
    elsif params[:inYear]
      return "AND year = '#{params[:inYear]}'"
    else
      return ''
    end
  end


  def regionsGetCurrentRecordsQuery(valueId, valueName)
    <<-ENDSQL
      SELECT
      '#{valueName}'        type,
      result.competitionId  competitionId,
      result.personId       personId,
      result.personName     personName,
      result.countryId      countryId,
      result.eventId        eventId,
      result.roundId        roundId,
      result.formatId       formatId,
      result.value1         value1,
      result.value2         value2,
      result.value3         value3,
      result.value4         value4,
      result.value5         value5,
      result.regionalAverageRecord,
      result.regionalSingleRecord,
                            value,
      event.name            eventName,
      event.cellName        eventCellName,
                            format,
      country.name          countryName,
      competition.cellName  competitionName,
                            rank, year, month, day
    FROM
      (SELECT eventId recordEventId, MIN(valueAndId) DIV 1000000000 value
       FROM Concise#{valueName}Results
       WHERE 1 #{regionCondition(nil)} #{eventCondition} #{yearCondition}
       GROUP BY eventId) record,
      Results result,
      Events event,
      Countries country,
      Competitions competition
    WHERE result.#{valueId} = value
      #{regionCondition('result')} #{eventCondition()} #{yearCondition()}

      AND result.eventId = recordEventId
      AND event.id       = result.eventId
      AND country.id     = result.countryId
      AND competition.id = result.competitionId
      AND event.rank < 990
    ENDSQL
  end

  def show
    resultQuery = <<-ENDSQL
      SELECT *
        FROM (#{regionsGetCurrentRecordsQuery('best','Single')}
        UNION #{regionsGetCurrentRecordsQuery('average', 'Average')}) helper
        ORDER BY rank, type DESC, year, month, day, roundId, personName
    ENDSQL

    results = ActiveRecord::Base.connection.select_all(resultQuery)

    records = results.group_by{ |row| row['eventId'] }
    records.update(records) { |eventId, recs|
      singles = recs.select { |rec| rec['type'] == 'Single'}
      averages = recs.select { |rec| rec['type'] == 'Average'}

      record = {
        singles: singles.map { |s| {
          competitionId: s['competitionId'],
          personId: s['personId'],
          personName: s['personName'],
          countryId: s['countryId'],
          value: s['value'],
          regionalSingleRecord: s['regionalSingleRecord']
        }},
      }

      if recs[1]
        record['average'] = averages.map { |a| {
          competitionId: a['competitionId'],
          personId: a['personId'],
          personName: a['personName'],
          countryId: a['countryId'],
          value: a['value'],
          average: a['formatId'] == 'a' ? [a['value1'], a['value2'], a['value3'], a['value4'], a['value5']] : [a['value1'], a['value2'], a['value3']],
          regionalSingleRecord: a['regionalAverageRecord']
        }}
      end

      record
    }

    render status: :ok, json: records
  end
end
