import { TextFieldEntry, NumberFieldEntry, isTextFieldEntryEdited, isNumberFieldEntryEdited, SelectEntry, isSelectEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export default function(element) {

  return [
    {
      id: 'guard',
      element,
      component: Guard,
      isEdited: isTextFieldEntryEdited
    },
    { 
    id: 'destination',
    element,
    component: Destination,
    isEdited: isSelectEntryEdited
    },
    { 
      id: 'velocity',
      element,
      component: Velocity,
      isEdited: isNumberFieldEntryEdited
      },
      { 
        id: 'duration',
        element,
        component: Duration,
        isEdited: isNumberFieldEntryEdited
        } 

  ];
}

function Guard(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.guard || '';
  }

  const setValue = value => {
    return modeling.updateProperties(element, {
      guard: value
    });
  }

  return <TextFieldEntry
    id={ id }
    element={ element }
    description={ translate('') }
    label={ translate('Guard') }
    getValue={ getValue }
    setValue={ setValue }
    debounce={ debounce }
  />
}

  function Destination(props) {
    const { element, id } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => {
      return element.businessObject.destination || '';
    }
  
  

    const getOptions = () =>  createOptions(); 

    function createOptions(overrides = {}) {
      const {
        options = []
      } = overrides;

    //definisci un array con le destinazioni che all'inizio è vuoto
    //ad ogni nuovo olc:state aggiungiamo l'opzione dinamicamente
     //fire o dispatch cerca. 

    //for(let i=0; states.lenght; i++ ) {
      const newOptions = [
        {
          label: 'states[i]',
          value: 'prova'
        },
        ...options
      ];
      return newOptions;
     // }
    }

   /* const setValue = value => {
      return modeling.updateProperties(element, {
        destination: value
      });
    }*/

    return <SelectEntry
    id={ id }
    element={ element }
    label={ translate('Destination') }
    getValue={ getValue }
    getOptions= {getOptions}
    debounce={ debounce }
  />
}

function Velocity(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.velocity || '';
  }

  const setValue = value => {
    return modeling.updateProperties(element, {
      velocity: value
    });
  }
  return <NumberFieldEntry
  id={ id }
  element={ element }
  description={ translate('Define robot velocity') }
  label={ translate('Velocity') }
  getValue={ getValue }
  setValue={ setValue }
  debounce={ debounce }
/>
}

function Duration(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.duration || '';
  }

  const setValue = value => {
    return modeling.updateProperties(element, {
      duration: value
    });
  }

  return <NumberFieldEntry
  id={ id }
  element={ element }
  description={ translate('Must be integer number') }
  label={ translate('Duration') }
  getValue={ getValue }
  setValue={ setValue }
  debounce={ debounce }
/>
}
