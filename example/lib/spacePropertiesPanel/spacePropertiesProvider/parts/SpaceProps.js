import { TextFieldEntry, isTextFieldEntryEdited, isNumberFieldEntryEdited } from '@bpmn-io/properties-panel';
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
    isEdited: isTextFieldEntryEdited
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
  
    const setValue = value => {
      return modeling.updateProperties(element, {
        destination: value
      });
    }
    return <TextFieldEntry
    id={ id }
    element={ element }
    description={ translate('') }
    label={ translate('Destination') }
    getValue={ getValue }
    setValue={ setValue }
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
  return <TextFieldEntry
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

  return <TextFieldEntry
  id={ id }
  element={ element }
  description={ translate('Must be integer number') }
  label={ translate('Duration') }
  getValue={ getValue }
  setValue={ setValue }
  debounce={ debounce }
/>
}
