"use client"
import React from 'react';
import {Table, Text, Link} from "@chakra-ui/react";
import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";


import { Button, CloseButton, Drawer, Portal } from "@chakra-ui/react"
import { useState } from "react"
import EventIcon from "@/components/EventIcon"
import CountryMap from "@/components/CountryMap"

interface Comps {
    name: string;
    id: string;
    dateStart: Date;
    dateEnd: Date;
    city: string;
    country: string;
    regoStatus: string;
    competitorLimit: BigInteger;
    events: String[],
    mainEvent: String,
}

const regoStatusIcons: Record<string, TSX.Element> = {
    open: <CompRegoNotFullOpenGreenIcon/>,
    notOpen: <CompRegoNotOpenYetGreyIcon/>,
    closed: <CompRegoClosedRedIcon />,
    full: <CompRegoFullButOpenOrangeIcon />,
  };

interface CompsProps {
    comp: Comps;
}

function formatDateRange(start: Date, end: Date): string {
    const sameDay = start.toDateString() === end.toDateString();
  
    // Formatters
    const dayFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric' });
    const monthDayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const fullFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
    if (sameDay) {
      return fullFormatter.format(start);
    }
  
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();
  
    if (sameMonth && sameYear) {
      return `${monthDayFormatter.format(start)} - ${dayFormatter.format(end)}, ${start.getFullYear()}`;
    }
  
    if (sameYear) {
      return `${monthDayFormatter.format(start)} - ${monthDayFormatter.format(end)}, ${start.getFullYear()}`;
    }
  
    return `${fullFormatter.format(start)} - ${fullFormatter.format(end)}`;
  }
  

const CompetitionTableEntry: React.FC<CompsProps> = ({ comp }) => {
    const [open, setOpen] = useState(false)
    console.log({comp});
    return (
    <Table.Row bg="bg.inverted" onClick={() => setOpen(true)} key={comp.id}>
        <Table.Cell>
            {regoStatusIcons[comp.regoStatus] || null}
        </Table.Cell>
        <Table.Cell>
            <Text>{formatDateRange(comp.dateStart, comp.dateEnd)}</Text>
        </Table.Cell>
        <Table.Cell>
            <Link hoverArrow href={"/competitions/" + comp.id} onClick={(e) => {
                e.stopPropagation();
                }}>
                {comp.name}
            </Link>
        </Table.Cell>
        <Table.Cell>
            <Text>{comp.city}</Text>
        </Table.Cell>
        <Table.Cell>
           <CountryMap code={comp.country} bold />
        </Table.Cell>
        <Table.Cell>
            <Text>{comp.country}</Text>
        </Table.Cell>
        <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} variant="competitionInfo">
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner padding="4">
                    <Drawer.Content>
                    <Drawer.Header>
                        <Drawer.Title>{comp.name}</Drawer.Title>
                    </Drawer.Header>
                    <Drawer.Body>
                        <Text>Competitor Limit: {comp.competitorLimit}</Text>
                        <Text>Events:</Text>
                        {comp.events.map((eventIndividual) => (
                            <EventIcon eventId={eventIndividual} key={eventIndividual} main={eventIndividual === comp.mainEvent}/>
                        ))}
                    </Drawer.Body>
                    <Drawer.Footer>
                        <Button variant="outline">Cancel</Button>
                        <Button>Save</Button>
                    </Drawer.Footer>
                    <Drawer.CloseTrigger asChild>
                        <CloseButton size="sm" />
                    </Drawer.CloseTrigger>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    </Table.Row>
    );
}

export default CompetitionTableEntry;