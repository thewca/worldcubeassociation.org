import React, { useContext } from 'react';
import { Button, Popup } from 'semantic-ui-react';
import DelegateMattersContext from '../../lib/contexts';
import {
  competitionUrl,
  competitionReportUrl,
} from '../../lib/requests/routes.js.erb';

// helpers //

function SearchForTagButton(addTagToSearch, tag) {
  return (
    <Button basic onClick={() => addTagToSearch(tag)}>
      Filter by this tag
    </Button>
  );
}

// tags //

/**
 * Displays a Tag for a regulation (or guideline).
 */
export function RegulationTag({
  id,
  type,
  description,
  link,
  addToSearch,
}) {
  const links = (
    <a target="_blank" rel="noreferrer" className="hide-new-window-icon" href={link}>
      {type}
      {'s '}
      Reference
    </a>
  );

  return (
    <Tag
      tagType="incident"
      labelClass="primary"
      label={id}
      title={`${type} ${id}`}
      description={description}
      links={links}
      buttons={addToSearch && SearchForTagButton(addToSearch, id)}
    />
  );
}

/**
 * Displays a Tag for a non-regulation tag (such as "misscramble" or "duplicate").
 */
export function MiscTag({ tag, addToSearch }) {
  return (
    <Tag
      tagType="incident"
      labelClass="default"
      label={tag}
      title={tag}
      buttons={addToSearch && SearchForTagButton(addToSearch, tag)}
    />
  );
}

/**
 * Displays a Tag for a competition.
 */
export function CompetitionTag({
  id,
  name,
  comments,
}) {
  const canViewDelegateMatters = useContext(DelegateMattersContext);
  const links = canViewDelegateMatters ? (
    <>
      <a target="_blank" rel="noreferrer" className="hide-new-window-icon" href={competitionUrl(id)}>Competition Page</a>
      <br />
      <a target="_blank" rel="noreferrer" className="hide-new-window-icon" href={competitionReportUrl(id)}>Delegate Report</a>
    </>
  ) : (
    <a target="_blank" rel="noreferrer" className="hide-new-window-icon" href={competitionUrl(id)}>Competition Page</a>
  );

  // Note: comments should be null anyway if user can't view delegate matters
  return (
    <Tag
      tagType="competition"
      labelClass="info"
      label={id}
      title={name}
      description={canViewDelegateMatters ? comments : null}
      links={links}
    />
  );
}

/**
 * Displays a Tag which produces a popover when clicked.
 */
function Tag({
  tagType,
  labelClass,
  label,
  title,
  description,
  links,
  buttons,
}) {
  return (
    <Popup
      header={title}
      content={(
        <>
          {
            description && (
              <>
                <hr />
                {/* eslint-disable-next-line react/no-danger */}
                <span dangerouslySetInnerHTML={{ __html: description }} />
              </>
            )
          }
          {
            links && (
              <>
                <hr />
                {links}
              </>
            )
          }
          {
            buttons && (
              <>
                <hr />
                {buttons}
              </>
            )
          }
        </>
      )}
      on="click"
      trigger={(
        <span
          className={`${tagType}-tag label label-${labelClass}`}
        >
          {label}
        </span>
      )}
    />
  );
}
