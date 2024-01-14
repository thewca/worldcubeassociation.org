import React from 'react';
import {
  Dropdown,
  Grid, Header, Icon, Menu, Segment,
} from 'semantic-ui-react';
import useHash from '../../lib/hooks/useHash';

export default function PanelTemplate({ heading, sections }) {
  const [hash, setHash] = useHash();

  const SelectedComponent = React.useMemo(() => {
    const selectedMenuIndex = sections.findIndex((section) => section.id === hash);
    if (selectedMenuIndex === -1) {
      setHash(sections[0].id);
      return () => null;
    }
    const selectedSection = sections[selectedMenuIndex];
    if (selectedSection.component) {
      return selectedSection.component;
    }
    window.open(selectedSection.link);
    return () => null;
  }, [sections, hash, setHash]);

  return (
    <div className="container">
      <Header as="h1">{heading}</Header>
      <Grid container>
        <Grid.Column only="computer" computer={4}>
          <Menu vertical>
            {sections.map((section) => (
              <Menu.Item
                key={section.id}
                name={section.name}
                active={section.id === hash}
                onClick={() => setHash(section.id)}
              >
                {!section.component && <Icon name="external alternate" />}
                {section.name}
              </Menu.Item>
            ))}
          </Menu>
        </Grid.Column>

        <Grid.Column stretched computer={12} mobile={16} tablet={16}>
          <Segment>
            <Grid container padded>
              <Grid.Row only="tablet mobile">
                <Dropdown
                  inline
                  options={sections.map((section) => ({
                    key: section.id,
                    text: section.name,
                    value: section.id,
                    icon: !section.component && 'external alternate',
                  }))}
                  value={hash}
                  onChange={(_, { value }) => setHash(value)}
                />
              </Grid.Row>
              {/* TODO: Fix the Grid.Row by removing CSS style and using appropriate props from
                        semantic-ui */}
              <Grid.Row style={{ margin: 0 }}>
                <div style={{ width: '100%' }}><SelectedComponent /></div>
              </Grid.Row>
            </Grid>
          </Segment>
        </Grid.Column>
      </Grid>
    </div>
  );
}
