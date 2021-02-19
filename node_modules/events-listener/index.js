function EventListener() {
    if(!(this instanceof EventListener)) {
        return new EventListener();
    }
    this._listeners = [];
};

/**
 * Call `handler()` whenever `target` emits the specified `event`.
 *
 * @param  {EventEmitter} target - The EventEmitter to listen to.
 * @param  {string} event - The event to listen for.
 * @param  {function} handler - Handler to call when the event is emitted.
 * @return {EventListener} - Returns a reference to the `EventListener` so calls can be chained.
 */
EventListener.prototype.listenTo = function(target, event, handler) {
    this._listeners.push({target: target, event: event, handler: handler});
    target.on(event, handler);
    return this;
}

/**
 * Call `handler()` once when `target` emits the specified `event`.
 *
 * @param  {EventEmitter} target - The EventEmitter to listen to.
 * @param  {string} event - The event to listen for.
 * @param  {function} handler - Handler to call when the event is emitted.
 * @return {EventListener} - Returns a reference to the `EventListener` so calls can be chained.
 */
EventListener.prototype.listenToOnce = function(target, event, handler) {
    var _this = this;

    var once = function() {
        for(var i = 0; i < _this._listeners.length; i++) {
            var listener = _this._listeners[i];
            if(listener.once === once) {
                _this._listeners.splice(i, 1);
                break;
            }
        }
        handler.apply(_this, arguments);
    };

    this._listeners.push({target: target, event: event, handler: handler, once: once});
    target.once(event, once);
    return this;
}

EventListener.prototype.stopListening = function(target, event, handler) {
    var _this = this;
    var removed = 0;

    var i = 0;
    while(i < this._listeners.length) {
        var listener = this._listeners[i];
        if(
            (!target || listener.target === target) &&
            (!event || listener.event === event) &&
            (!handler || listener.handler === handler || listener.once === handler)
        ) {
            listener.target.removeListener(listener.event, listener.once || listener.handler);
            this._listeners.splice(i, 1);
            removed++;
        } else {
            i++;
        }
    }

    return removed;
};

module.exports = EventListener;
