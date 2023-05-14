import React from 'react';

function CompetitionTable({
  competitions,
  title,
  sortByAnnouncement = false,
}) {
  return (
    <ul className="list-group">
      <li className="list-group-item">
        <strong>
          {`${title} (${competitions.length})`}
        </strong>
      </li>
      {competitions.map((comp, index) => (
        <>
          {(index > 0 && comp.year !== competitions[index - 1].year && !sortByAnnouncement) && <li className="list-group-item break">{comp.year}</li>}
          <li key={comp.id} className={`list-group-item${comp.isProbablyOver ? ' past' : ' not-past'}${comp.cancelled ? ' cancelled' : ''}`}>
            <span className="date">
              {comp.displayName}
            </span>
            <span className="competition-info">
              <div className="competition-link">
                123
              </div>
              <div className="location">
                <strong>{comp.countryName}</strong>
                {`, ${comp.cityName}`}
              </div>
              <div className="venue-link">
                123
              </div>
            </span>
          </li>
        </>
      ))}
    </ul>
  );
}

export default CompetitionTable;
