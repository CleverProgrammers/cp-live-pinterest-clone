import EventEmitter from 'events';

export default class EventListener {
    listenTo(target: EventEmitter, event: string, handler: Function) : this;
    listenTo(target: EventEmitter, event: 'error', handler: (err: Error) => void) : this;
    listenToOnce(target: EventEmitter, event: string, handler: Function) : this;
    stopListening(target?: EventEmitter, event?: string, handler?: Function) : number;
}
