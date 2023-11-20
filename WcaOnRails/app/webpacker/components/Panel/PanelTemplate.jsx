import React from 'react';
import {
  Dropdown,
  Grid, Header, Icon, Menu, Segment,
} from 'semantic-ui-react';

export default function PanelTemplate({ heading, sections }) {
  const [selectedMenu, setSelectedMenu] = React.useState(0);
  const SelectedComponent = React.useMemo(() => sections.find(
    (_, index) => index === selectedMenu,
  ).component, [sections, selectedMenu]);

  function menuClickHandler(index) {
    const section = sections[index];
    if (section.component) {
      setSelectedMenu(index);
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
            {sections.map((section, index) => (
              <Menu.Item
                key={section.id}
                name={section.name}
                active={selectedMenu === index}
                onClick={() => menuClickHandler(index)}
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
