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

function decodeSensorValue(rawValue) {
    const result = [];
    const array = new Uint8Array(rawValue);
    const data = new DataView(array.buffer);
    for(let i=0; i<12; i+=4) {
        result.push(data.getFloat32(i,true));
    }
    return result.map(f => f.toFixed(2)).join(", ");
}

function characteristicValueChanged(state, characteristic) {
    logger.info("characteristic value change", characteristic.instanceId, characteristic.value);
    if(state.hasIn(["sensors", characteristic.instanceId])) {
        const { instanceId: sensorId, value: rawValue } = characteristic;
        // const sensor = state.sensors.get(sensorId);
        try {
            const value = decodeSensorValue(rawValue);
            if(value != null)
                return updateSensorValue(state, sensorId, value);    
        }
        catch(error) {
            logger.error(error.message);
        }
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