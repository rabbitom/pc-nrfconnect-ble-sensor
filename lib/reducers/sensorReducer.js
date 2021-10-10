'use strict';

import { OrderedMap, Record } from 'immutable';
import * as SensorActions from '../actions/sensorActions';
import * as AdapterActions from '../actions/adapterActions';
import { logger } from 'nrfconnect/core';

const InitialState = Record({
    selectedComponent: null,
    sensors: OrderedMap(),
});

const initialState = new InitialState();

function updateSensorValue(state, sensorId, value) {
    logger.info("update sensor value", sensorId, value);
    return state.setIn(["sensors", sensorId, "value"], value);
}

// function decodeSensorValue(sensor, rawValue) {
//     return rawValue;
// }

function characteristicValueChanged(state, characteristic) {
    logger.info("characteristic value change", characteristic.instanceId, characteristic.value);
    if(state.hasIn(["sensors", characteristic.instanceId])) {
        const { instanceId: sensorId, value: rawValue } = characteristic;
        // const sensor = state.sensors.get(sensorId);
        // value = decodeSensorValue(sensor, rawValue);
        // if(value != null)
            return updateSensorValue(state, sensorId, rawValue);
    }
    return state;
}

export default function sensor(state = initialState, action) {
    switch(action.type) {
        case SensorActions.ADD_SENSOR:
            logger.info("add sensor", action.sensor.id);
            return state.setIn(["sensors", action.sensor.id], action.sensor);
        case SensorActions.CLEAR_SENSORS:
            return state.set("sensors", OrderedMap());
        case SensorActions.UPDATE_SENSOR_VALUE:
            return updateSensorValue(state, action.sensor.id, action.value);
        case SensorActions.UPDATE_SENSOR_STATUS:
            return state.setIn(["sensors", action.sensor.id, "isOn"], action.status);
        case AdapterActions.CHARACTERISTIC_VALUE_CHANGED:
            return characteristicValueChanged(state, action.characteristic);
        default:
            return state;
    }
}