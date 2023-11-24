import React from 'react';
import {
  Dropdown,
  Grid, Header, Icon, Menu, Segment,
} from 'semantic-ui-react';
import useHash from '../../lib/hooks/useHash';

export default function PanelTemplate({ heading, sections }) {
  const [hash, setHash] = useHash();

  const selectedMenu = React.useMemo(() => (hash ? sections.findIndex(
    (section) => section.id === hash,
  ) : 0), [hash, sections]);

  if (selectedMenu === -1) {
    setHash(sections[0].id);
  }

  const SelectedComponent = React.useMemo(() => {
    const selectedSectionIndex = sections.findIndex((section) => section.id === hash);
    const selectedSection = sections[selectedSectionIndex] || sections[0];
    if (selectedSectionIndex === -1) {
      setHash(selectedSection.id);
    }
    if (selectedSection.component) {
      return selectedSection.component;
    }
    window.location.href = selectedSection.link;
    return () => null;
  }, [sections, hash, setHash]);

  const selectSection = React.useCallback((section) => {
    if (section.component) {
      setHash(section.id);
    } else {
      window.open(section.link);
    }
  }, [setHash]);

  return (
    <div className="container">
      <Header as="h1">{heading}</Header>
      <Grid container>
        <Grid.Column only="computer" computer={4}>
          <Menu vertical>
            {sections.map((section, index) => (
              <Menu.Item
                key={section.id}
                name={section.name}
                active={selectedMenu === index}
                onClick={() => selectSection(section)}
              >
                {!section.component && <Icon name="external alternate" />}
                {section.name}
              </Menu.Item>
            ))}
          </Menu>
        </Grid.Column>

        <Grid.Column stretched computer={12} mobile={16} tablet={16}>
          <Segment>
            <Grid container centered>
              <Grid.Row only="tablet mobile">
                <Dropdown
                  inline
                  options={sections.map((section, index) => ({
                    key: section.id,
                    text: section.name,
                    value: index,
                    icon: !section.component && 'external alternate',
                  }))}
                  value={selectedMenu}
                  onChange={(_, { value }) => selectSection(sections[value])}
                />
              </Grid.Row>
              <Grid.Row><SelectedComponent /></Grid.Row>
            </Grid>
          </Segment>
        </Grid.Column>
      </Grid>
    </div>
  );
}
