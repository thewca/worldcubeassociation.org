import React from "react";
import useLoadedData from "../requests/loadable";
import { registerComponent } from "../wca/react-utils";
import Loading from "../requests/Loading";
import Errored from "../requests/Errored";
import { formatAttemptResult } from '../wca-live/attempts';
import { useState } from "react";
import classnames from "classnames";
import "./index.scss";
import { Table, Popup } from "semantic-ui-react";
import EventIcon from '../wca/EventIcon';
import CountryFlag from '../wca/CountryFlag';

const CompetitionResultsNavigation = ({ events, selected, onSelect }) => {
  return (
    <div className={"events-list"}>
      {events.map((event, index) => (
        <Popup
          key={event}
          content={`${event}`}
          trigger={
            <EventIcon
              key={event}
              id={event}
              onClick={() => onSelect(index)}
              className={classnames(selected === index && "selected")}
            />
          }
          inverted={true}
        />
      ))}
    </div>
  );
};

const RoundResultsTable = ({ round, eventName, eventId }) => {
  return (
    <>
      <h2>{`${eventName} ${round.name}`}</h2>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>#</Table.HeaderCell>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Best</Table.HeaderCell>
            <Table.HeaderCell> Average</Table.HeaderCell>
            <Table.HeaderCell>Citizen Of</Table.HeaderCell>
            <Table.HeaderCell>Solves</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {round.results.map((result) => (
            <Table.Row key={result.id}>
              <Table.Cell>{result.pos}</Table.Cell>
              <Table.Cell>
                <a href={`/persons/${result.wca_id}`}>{`${result.name}`}</a>
              </Table.Cell>
              <Table.Cell>{formatAttemptResult(result.best, eventId)}</Table.Cell>
              <Table.Cell>{formatAttemptResult(result.average, eventId, true)}</Table.Cell>
              <Table.Cell><CountryFlag iso2={result.country_iso2} /></Table.Cell>
              <Table.Cell>{result.attempts.map(a => formatAttemptResult(a, eventId)).join("\t\t")}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
};

const EventResults = ({ competitionId, eventId }) => {
  const { loading, error, data } = useLoadedData(
    `/api/v0/competitions/${competitionId}/results/${eventId}`
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;
  return (
    <div className="event-results">
      {data.rounds.map((round) => (
        <RoundResultsTable key={round.id} round={round} eventName={data.name} eventId={data.id} />
      ))}
    </div>
  );
};

const CompetitionResults = ({ competitionId }) => {
  const { loading, error, data } = useLoadedData(
    `/api/v0/competitions/${competitionId}/`
  );
  const [selectedEvent, setSelectedEvent] = useState(0);
  if (loading) return <Loading />;
  if (error) return <Errored />;
  return (
    <div className="competition-results">
      <CompetitionResultsNavigation
        events={data.event_ids}
        selected={selectedEvent}
        onSelect={(eventIndex) => setSelectedEvent(eventIndex)}
      />
      <EventResults
        competitionId={competitionId}
        eventId={data.event_ids[selectedEvent]}
      />
    </div>
  );
};
registerComponent(CompetitionResults, "CompetitionResults");
