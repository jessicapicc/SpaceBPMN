import CommandInterceptor from "diagram-js/lib/command/CommandInterceptor";
import { without } from 'min-dash';
import CommonEvents from "../../common/CommonEvents";
import getDropdown from "../../util/Dropdown";
import { appendOverlayListeners } from "../../util/HtmlUtil";
import { formatStates, is } from "../../util/Util";

export default class DataObjectLabelHandler extends CommandInterceptor {
    constructor(eventBus, modeling, directEditing, overlays, spaceModeler) {
        super(eventBus);
        this._eventBus = eventBus;
        this._modeling = modeling;
        this._directEditing = directEditing;
        this._dropdownContainer = document.createElement('div');
        this._dropdownContainer.classList.add('dd-dropdown-multicontainer');
        //this._classDropdown = getDropdown("Class");
        //this._dropdownContainer.appendChild(this._classDropdown);
        this._stateDropdown = getDropdown("States");
        this._dropdownContainer.appendChild(this._stateDropdown);
        this._currentDropdownTarget = undefined;
        this._overlayId = undefined;
        this._overlays = overlays;
        this._spaceModeler = spaceModeler;

        /*eventBus.on('element.changed', function (e) {
            if (is(e.element, 'bpmn:Task')) {
                const businessObject = e.element.businessObject;
                console.log(businessObject.states);
                const name = `${businessObject.states?.name}${formatStates(businessObject.get('states'))}`;
                console.log(name);
                if (businessObject.name !== name) {
                    modeling.updateLabel(e.element, name, undefined, {
                        dataObjectLabelUpdate: true
                    });
                }
            }
        });*/

        /*eventBus.on('directEditing.activate', function (e) {
            if (is(e.active.element, 'bpmn:Task')) {
                directEditing.cancel();
            }
        });*/

        eventBus.on(['element.dblclick', 'create.end', 'autoPlace.end'], e => {
            const element = e.element || e.shape || e.elements[0];
            if (is(element, 'bpmn:Task')) {
                const olcs = this._spaceModeler._olcs;
                const dataObject = element.businessObject;
                this._dropdownContainer.currentElement = element;
                //console.log(olcs.filter(olc => olc.id===dataObject.states)[0]);
               
                //currentOlc = olcs.filter(olc => olc.classRef === dataObject.dataclass)[0];
                //this._classDropdown.getEntries().forEach(entry => entry.setSelected(entry.option === currentOlc));
                //states = currentOlc.get('Elements').filter(element => is(element, 'olc:State'));
                let currentOlc = olcs.filter(element => is(element, 'olc:State'));
                console.log(currentOlc);

                const updateStateSelection = () => {
                    this._stateDropdown.getEntries().forEach(entry => entry.setSelected(dataObject.get('destination').includes(entry.option)));
                }

                /*const updateClassSelection = () => {
                    if (olcs.length > 0) {
                        let states = [];
                        if (dataObject.states) {
                            currentOlc = olcs.filter(olc => olc.id === dataObject.states)[0];
                            this._classDropdown.getEntries().forEach(entry => entry.setSelected(entry.option === currentOlc));
                            states = currentOlc.get('Elements').filter(element => is(element, 'olc:State'));
                        }
                    
                        this._stateDropdown.populate(states, (newState, element) => {
                            this.updateState(newState, element);
                            updateStateSelection();
                        }, element);

                        // Prevent adding new states if no dataclass is selected
                        dataObject.states && this._stateDropdown.addCreateElementInput(event => this._dropdownContainer.confirm());
                    } else {
                        this._stateDropdown.populate([], (newState, element) => {
                            this.updateState(newState, element);
                            updateStateSelection();
                        }, element);
                    }
                }*/

                const populateStateDropdown = () => {
                    this._stateDropdown.populate(olcs, (newState, element) => {
                        this.updateState(newState, element);
                        updateStateSelection();
                    }, element);
                    this._stateDropdown.addCreateElementInput(event => this._dropdownContainer.confirm());
                    updateStateSelection();
                }

                populateStateDropdown();

                this._dropdownContainer.confirm = (event) => {
                    //const newClassInput = this._classDropdown.getInputValue();
                    const newStateInput = this._stateDropdown.getInputValue();
                    let needUpdate = false;
                    /*if (newClassInput !== '') {
                        const newClass = this.createDataclass(newClassInput);
                        this.updateClass(newClass, element);
                        populateClassDropdown();
                        needUpdate = true;
                    }*/
                    if (newStateInput !== '') {
                        const newState = this.createState(newStateInput,currentOlc);// currentOlc);
                        this.updateState(newState, element);
                        populateStateDropdown();
                        needUpdate = true;
                    }
                    if (needUpdate) {
                        //updateClassSelection();
                        updateStateSelection();
                        this._stateDropdown.focusInput();
                    }
                }

                let shouldBlockNextClick = e.type === 'create.end';
                this._dropdownContainer.handleClick = (event) => {
                    if (shouldBlockNextClick) {
                        shouldBlockNextClick = false;
                        return true;
                    } else if (!this._dropdownContainer.contains(event.target)) {
                        return false;
                    } else if (event.target.classList.contains('dd-dropdown-entry')) {
                       // this._classDropdown.clearInput();
                        this._stateDropdown.clearInput();
                    } else if (event.target.tagName !== 'INPUT' || !event.target.value) {
                        this._dropdownContainer.confirm();
                    }
                    return true;
                }

                this._dropdownContainer.close = () => {
                    if (this._overlayId) {
                        this._overlays.remove(this._overlayId);
                        this._overlayId = undefined;
                    }
                    if (this._currentDropdownTarget?.states === undefined) {
                        this._modeling.removeElements([this._dropdownContainer.currentElement]);
                    }
                    this._dropdownContainer.currentElement = undefined;
                    this._currentDropdownTarget = undefined;
                }

                const closeOverlay = appendOverlayListeners(this._dropdownContainer);
                eventBus.once('element.contextmenu', event => {
                    if (this._currentDropdownTarget && ((event.element || event.shape).businessObject !== this._currentDropdownTarget)) {
                        closeOverlay(event);
                        event.preventDefault();
                    }
                });

                // Show the menu(e)
               /* this._overlayId = overlays.add(element.id, 'stateSelection', {
                    position: {
                        bottom: 0,
                        right: 0
                    },
                    scale: false,
                    html: this._dropdownContainer
                });*/

                this._currentDropdownTarget = element.businessObject;
            }
        });
    }

   /* updateClass(newClass, element) {
        element.businessObject.dataclass = newClass;
        element.businessObject.states = [];
        this._eventBus.fire('element.changed', {
            element
        });
    }*/

    updateState(newState, element) {
        const dataObject = element.businessObject;
        if (dataObject.get('destination').includes(newState)) {
            dataObject.states = without(dataObject.get('destination'), newState);
        } else {
            dataObject.states.push(newState);
        }
    }

   /* createState(name, olc) {
        return this._eventBus.fire(CommonEvents.STATE_CREATION_REQUESTED, {
            name,
            olc
        });
    }*/

    /*createDataclass(name) {
        return this._eventBus.fire(CommonEvents.DATACLASS_CREATION_REQUESTED, {
            name
        });
    }*/
}

DataObjectLabelHandler.$inject = [
    'eventBus',
    'modeling',
    'directEditing',
    'overlays',
    'spaceModeler'
];
