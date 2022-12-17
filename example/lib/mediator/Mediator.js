import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
import inherits from 'inherits';
import { isFunction, without } from 'min-dash';
import { is } from '../util/Util';
import OlcEvents from '../olcmodeler/OlcEvents';
import { namespace, root } from '../util/Util';
import AbstractHook from './AbstractHook';
import CommonEvents from '../common/CommonEvents';

const DEFAULT_EVENT_PRIORITY = 1000; //From diagram-js/lib/core/EventBus.DEFAULT_PRIORITY

// Test: var a = new Mediator(); var b = new Mediator; assert new a.XYHook().mediator === a;
// a = new Mediator(); b = new Mediator(); new a.foobar().mediator === a

export default function Mediator() {
    var self = this;
    this._hooks = [];
    for (let propName in this) {
        let prototypeProp = this[propName];
        if (typeof prototypeProp === 'function' && prototypeProp.isHook) {
            this[propName] = function (...args) {
                if (new.target) {
                    this.mediator = self;
                    this.name = propName;
                }
                const callresult = prototypeProp.call(this, ...args);
                if (new.target) {
                    this.mediator.handleHookCreated(this);
                }
                return callresult;
            }
            this[propName].$inject = prototypeProp.$inject;
            this[propName].isHook = true;
            inherits(this[propName], prototypeProp);
        }
    }
    this._executed = [];
    this._on = [];

    //Propagate mouse events in order to defocus elements and close menus
    this.on(['element.mousedown', 'element.mouseup', 'element.click'], DEFAULT_EVENT_PRIORITY - 1, (event, data, hook) => {
        if (!event.handledByMediator) {
            const { originalEvent, element } = event;
            without(this.getHooks(), hook).forEach(propagateHook => {
                propagateHook.eventBus?.fire(event.type, { originalEvent, element, handledByMediator: true });
            });
        } else {
            // Do not propagate handle these events by low priority listeners such as canvas-move
            event.cancelBubble = true;
        }
    });

    this.on(CommonEvents.DATACLASS_CREATION_REQUESTED, event => {
        return this.createDataclass(event.name);
    });

 /*   this.on(CommonEvents.STATE_CREATION_REQUESTED, event => {
        return this.createState(event.name, event.olc);
    });*/
}

Mediator.prototype.getHooks = function () {
    return this._hooks;
}

Mediator.prototype.getModelers = function () {
    return this.getHooks().map(hook => hook.modeler);
}

Mediator.prototype.handleHookCreated = function (hook) {
    this._hooks.push(hook);

    this._executed.forEach(({events, callback}) => {
        if (hook.executed) {
            hook.executed(events, callback);
        }
    });

    this._on.forEach(({events, priority, callback}) => {
        hook.eventBus?.on(events, priority, wrapCallback(callback, hook));
    });
}

Mediator.prototype.executed = function(events, callback) {
    this._executed.push({events, callback});
    this.getHooks().forEach(hook => {
        if (hook.executed) {
            hook.executed(events, callback);
        }
    });
}

Mediator.prototype.on = function(events, priority, callback) {
    if (isFunction(priority)) {
        callback = priority;
        priority = DEFAULT_EVENT_PRIORITY;
    }
    this._on.push({events, priority, callback});
    this.getHooks().forEach(hook => {
        hook.eventBus?.on(events, priority, wrapCallback(callback, hook));
    });
}

function wrapCallback(callback, hook) {
    return (...args) => callback(...args, hook);
}

Mediator.prototype.addedClass = function (clazz) {
    this.olcModelerHook.modeler.addOlc(clazz);
}

Mediator.prototype.deletedClass = function (clazz) {
    this.olcModelerHook.modeler.deleteOlc(clazz);
}

Mediator.prototype.renamedClass = function (clazz) {
    this.olcModelerHook.modeler.renameOlc(clazz.name, clazz);
}

Mediator.prototype.addedState = function (olcState) {
}

Mediator.prototype.createState = function (name, olc) {
    const state = this.olcModelerHook.modeler.createState(name, olc);
    this.olcModelerHook.focusElement(state);
    return state;
}


Mediator.prototype.renamedState = function (olcState) {
    this.olcModelerHook.modeler.renameOlcState(olcState);
}

Mediator.prototype.createDataclass = function (name) {
    const clazz = this.dataModelerHook.modeler.createDataclass(name);
    this.dataModelerHook.focusElement(clazz);
    return clazz;
}

Mediator.prototype.focusElement = function(element) {
    const hook = this.getHookForElement(element);
    const modeler = hook.modeler;
    this.focus(modeler);
    if (element !== hook.getRootObject()) {
        hook.focusElement(element);
    }
}

Mediator.prototype.getHookForElement = function(element) {
    const elementNamespace = namespace(element);
    const modelers = this.getHooks().filter(hook => hook.getNamespace() === elementNamespace);
    if (modelers.length !== 1) {
        throw new Error('Modeler for element '+element+' was not unique or present: '+modelers);
    }
    return modelers[0];
}

// === Olc Modeler Hook
Mediator.prototype.OlcModelerHook = function (eventBus, olcModeler) {
    CommandInterceptor.call(this, eventBus);
    AbstractHook.call(this, olcModeler, 'OLCs');
    this.mediator.olcModelerHook = this;
    this.eventBus = eventBus;

    this.executed([
        'shape.create'
    ], event => {
        if (is(event.context.shape, 'olc:State')) {
            this.mediator.addedState(event.context.shape.businessObject);
        }
    });
    this.executed([
        'shape.delete',
        'elements.delete'
    ], event => {
        if (is(event.context.shape && event.context.elements, 'olc:State')) {
            this.mediator.deletedClass(event.context.shape.businessObject);
            this.mediator.deletedClass(event.context.element.businessObject);
        }
    });

    this.executed([
        'element.updateLabel'
    ], event => {
        if (is(event.context.element, 'olc:State')) {
            this.mediator.renamedState(event.context.element.businessObject);
        }
    }
    );

    this.reverted([
        'element.updateLabel'
    ], event => {
        if (is(event.context.element, 'olc:State')) {
            this.mediator.renamedState(event.context.element.businessObject);
        }
    });

    eventBus.on(OlcEvents.OLC_RENAME, event => {
        this.mediator.renamedClass(event.olc, event.name);
    });

   eventBus.on('import.parse.complete', ({context}) => {
        context.warnings.filter(({message}) => message.startsWith('unresolved reference')).forEach(({property, value, element}) => {
            if (property === 'olc:classRef') {
                const dataClass = this.mediator.dataModelerHook.modeler.get('elementRegistry').get(value).businessObject;
                if (!dataClass) { throw new Error('Could not resolve data class with id '+value); }
                element.classRef = dataClass;
            }
        });
    });

    this.locationOfElement = function(element) {
        return 'Olc ' + root(element).name;
    }
}
inherits(Mediator.prototype.OlcModelerHook, CommandInterceptor);

Mediator.prototype.OlcModelerHook.$inject = [
    'eventBus',
    'olcModeler'
];

Mediator.prototype.OlcModelerHook.isHook = true;