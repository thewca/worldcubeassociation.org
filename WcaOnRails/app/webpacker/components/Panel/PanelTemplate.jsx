import React from 'react';
import {
  Dropdown,
  Grid, Header, Menu, Segment,
} from 'semantic-ui-react';

export default function PanelTemplate({ heading, sections }) {
  const [selectedMenu, setSelectedMenu] = React.useState(sections[0].id);
  const SelectedComponent = React.useMemo(() => sections.find(
    (section) => section.id === selectedMenu,
  ).component, [sections, selectedMenu]);

  function menuClickHandler(section) {
    if (section.component) {
      setSelectedMenu(section.id);
    } else {
      window.open(section.link);
    }
  }

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
                active={selectedMenu === section.id}
                onClick={() => menuClickHandler(section)}
              >
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
                  options={sections.map((section) => ({
                    key: section.id,
                    text: section.name,
                    value: section.id,
                  }))}
                  value={selectedMenu}
                  onChange={(_, { value }) => menuClickHandler(value)}
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
