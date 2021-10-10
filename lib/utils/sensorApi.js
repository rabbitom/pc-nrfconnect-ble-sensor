'use strict';

import { Record } from 'immutable';

const ImmutableSensor = Record({
    id: null,
    name: null,
    serviceUuid: null,
    characteristicUuid: null,
    characteristicId: null,
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
        characteristicId: sensor.characteristicId,
        value: sensor.value,
        unit: sensor.unit,
    })
}