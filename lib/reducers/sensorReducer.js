'use strict';

import { OrderedMap, Record } from 'immutable';
import * as SensorActions from '../actions/sensorActions';

const InitialState = Record({
    selectedComponent: null,
    sensors: OrderedMap(),
});

const initialState = new InitialState();

function updateSensorValue(state, sensorId, value) {
    return state.setIn(["sensors", sensorId, "value"], value);
}

export default function sensor(state = initialState, action) {
    switch(action.type) {
        case SensorActions.ADD_SENSOR:
            return state.setIn(["sensors", action.sensor.id], action.sensor);
        case SensorActions.UPDATE_SENSOR_VALUE:
            return updateSensorValue(state, action.sensor.id, action.value);
        default:
            return state;
    }
}