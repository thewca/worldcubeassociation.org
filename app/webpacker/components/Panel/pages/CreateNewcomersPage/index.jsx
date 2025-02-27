import React from 'react';
import { Header, List, ListItem } from 'semantic-ui-react';
import CompetitionsInput from './CompetitionsInput';

export default function CreateNewcomersPage() {
  return (
    <>
      <Header>Create Newcomers</Header>
      <Information />
      <CompetitionsInput />
    </>
  );
}

function Information() {
  return (
    <>
      <p>
        In this script, a &quot;person&quot; always means a triple of (id,name,countryId) and
        &quot;similar&quot; always means just name similarity. A person is called
        &quot;finished&quot; if it has a non-empty personId. A &quot;semi-id&quot; is the id
        without the running number at the end.
      </p>
      <p>
        For each unfinished person in the Results table, I show you the few most similar
        persons. Then you make choices and click &quot;update&quot; at the bottom of the page
        to show and execute your choices. You can:
      </p>
      <List bulleted>
        <ListItem>
          Choose the person as &quot;new&quot;, optionally modifying name, country and
          semi-id. This will add the person to the Persons table (with appropriately
          extended id) and change its Results accordingly. If this person has both roman and
          local names, the syntax for the names to be inserted correctly is
          &quot;romanName (localName)&quot;.
        </ListItem>
        <ListItem>
          Choose another person. This will overwrite the person&apos;s (id,name,countryId)
          triple in the Results table with those of the other person.
        </ListItem>
        <ListItem>
          Skip it if you&apos;re not sure yet.
        </ListItem>
      </List>
    </>
  );
}
