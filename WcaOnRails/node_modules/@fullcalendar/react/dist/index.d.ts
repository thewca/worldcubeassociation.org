import { Component } from 'react';
import { CalendarOptions, CalendarApi } from '@fullcalendar/core';
import { CustomRendering } from '@fullcalendar/core/internal';
interface CalendarState {
    customRenderingMap: Map<string, CustomRendering<any>>;
}
export default class FullCalendar extends Component<CalendarOptions, CalendarState> {
    static act: typeof runNow;
    private elRef;
    private calendar;
    private handleCustomRendering;
    private resizeId;
    private isUpdating;
    private isUnmounting;
    state: CalendarState;
    render(): JSX.Element;
    componentDidMount(): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    requestResize: () => void;
    doResize(): void;
    cancelResize(): void;
    getApi(): CalendarApi;
}
declare function runNow(f: () => void): void;
export {};
