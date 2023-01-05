import inherits from 'inherits';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { without } from 'min-dash';
//import customModelingModule from './modeling';
import spacePropertiesProviderModule from '../bpmnmodeler/spacePropertiesPanel/spacePropertiesProvider/index.js'
import spaceModdleDescriptor from '../bpmnmodeler/spacePropertiesPanel/descriptors/space.json'
import { is } from 'bpmn-js/lib/util/ModelUtil';

export default function BpmnSpaceModeler(options) {  
//modeler for bpmn

const customModules = [
    spacePropertiesProviderModule,
    //customModelingModule, 
        {
            spaceModeler: ['value', this]
        }
    ];
    options.additionalModules = [
        ...customModules,
        ...(options.additionalModules || [])
    ];

    options.moddleExtensions = {
        space: spaceModdleDescriptor
    };

    BpmnModeler.call(this, options);

    //Explicitely allow the copying of references (to objects outside the fragment modeler)
    // See https://github.com/bpmn-io/bpmn-js/blob/212af3bb51840465e5809345ea3bb3da86656be3/lib/features/copy-paste/ModdleCopy.js#L218
    this.get('eventBus').on('moddleCopy.canCopyProperty', function(context) {
        if (context.propertyName === 'destination') {
            return context.property;
        }
    });
}
inherits(BpmnSpaceModeler, BpmnModeler);

BpmnSpaceModeler.prototype.handleOlcListChanged = function (olcs, dryRun=false) {
    this._olcs = olcs;
}


/*BpmnSpaceModeler.prototype.createState = function (olcState){
this.get(('elementFactory').createBusinessObject('olc:Olc', { name: clazz.name || '<TBD>'}))
}

OlcModeler.prototype.addOlc = function (clazz) {
    var olc = this.get('elementFactory').createBusinessObject('olc:Olc', { name: clazz.name || '<TBD>'});
    this._definitions.get('olcs').push(olc);
    this._emit(OlcEvents.DEFINITIONS_CHANGED, { definitions: this._definitions });
    this.showOlc(olc);
  }*/

BpmnSpaceModeler.prototype.handleStateRenamed = function (olcState) {
    this.getDataObjectReferencesInState(olcState).forEach((element, gfx) =>
        this.get('eventBus').fire('element.changed', {
            element
        })
    );
}

BpmnSpaceModeler.prototype.handleStateDeleted = function (olcState) {
    this.getDataObjectReferencesInState(olcState).forEach((element, gfx) => {
        element.businessObject.destination = without(element.businessObject.destination, olcState);
        this.get('eventBus').fire('element.changed', {
            element
        });
    });
}

/*FragmentModeler.prototype.handleClassRenamed = function (clazz) {
    this.getDataObjectReferencesOfClass(clazz).forEach((element, gfx) =>
        this.get('eventBus').fire('element.changed', {
            element
        })
    );
}

FragmentModeler.prototype.handleClassDeleted = function (clazz) {
    this.getDataObjectReferencesOfClass(clazz).forEach((element, gfx) =>
        this.get('modeling').removeElements([element])
    );
}*/

BpmnSpaceModeler.prototype.getDataObjectReferencesInState = function (olcState) {
    return this.get('elementRegistry').filter((element, gfx) =>
        is(element, 'bpmn:Task') &&
        element.type !== 'label' &&
        element.businessObject.destination
    );
}

/*FragmentModeler.prototype.getDataObjectReferencesOfClass = function (clazz) {
    return this.get('elementRegistry').filter((element, gfx) => 
        is(element, 'bpmn:DataObjectReference') &&
        element.type !== 'label' &&
        clazz.id &&
        element.businessObject.dataclass?.id === clazz.id
    );
}*/

BpmnSpaceModeler.prototype.startDoCreation = function(event, elementShape, dataclass, isIncoming) {
    const shape = this.get('elementFactory').createShape({
        type : 'bpmn:Task'
    });
    shape.businessObject.states = [];
    const hints = isIncoming ?
        {connectionTarget: elementShape}
        : undefined;
    this.get('autoPlace').append(elementShape, shape, hints);
    // The following works for outgoing data, but breaks the activity for incoming
    // fragmentModeler.get('create').start(event, shape, {
    //   source: activityShape,
    //   hints
    // });
}



