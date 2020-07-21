import React from "react";
import useLoadedData from "../requests/loadable";
import { registerComponent } from "../wca/react-utils";
import Loading from "../requests/Loading";
import Errored from "../requests/Errored";
import { useState } from "react";
import classnames from "classnames";
import "./index.scss";
import { Table, Popup } from "semantic-ui-react";

const CompetitionResultsNavigation = ({ events, selected, onSelect }) => {
  return (
    <div className={"events-list"}>
      {events.map((event, index) => (
        <Popup
          key={event}
          content={`${event}`}
          trigger={
            <span
              key={event}
              onClick={() => onSelect(index)}
              className={classnames(
                "cubing-icon",
                `event-${event}`,
                selected === index && "selected"
              )}
            />
          }
          inverted={true}
        />
      ))}
    </div>
  );
};

const RoundResultsTable = ({ round, eventName }) => {
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
              <Table.Cell>{result.best}</Table.Cell>
              <Table.Cell>{result.average}</Table.Cell>
              <Table.Cell>{result.country_iso2}</Table.Cell>
              <Table.Cell>{result.attempts.join("\t\t")}</Table.Cell>
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
        <RoundResultsTable round={round} eventName={data.name} />
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
