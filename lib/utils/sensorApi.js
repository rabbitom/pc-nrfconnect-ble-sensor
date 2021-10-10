'use strict';

import { Record } from 'immutable';

const ImmutableSensor = Record({
    id: null,
    name: null,
    serviceUuid: null,
    characteristicUuid: null,
    characteristic: null,
    isOn: false,
    value: null,
    unit: null,
})

// eslint-disable-next-line import/prefer-default-export
export function getImmutableSensor(sensor) {
    return new ImmutableSensor({
        id: sensor.id,
        name: sensor.name,
        serviceUuid: sensor.serviceUuid,
        characteristicUuid: sensor.characteristicUuid,
        characteristic: sensor.characteristic,
        isOn: sensor.isOn || false,
        value: sensor.value,
        unit: sensor.unit,
    })
}